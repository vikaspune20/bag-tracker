import { Response } from 'express';
import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const getStripeClient = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-08-27.basil' });
};

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:5173';
}

function planTypeFromPriceId(priceId: string): { planType: string; months: number; label: string } | null {
  const p200 = process.env.STRIPE_PRICE_MONTHLY_200;
  const p400 = process.env.STRIPE_PRICE_QUARTERLY_400;
  const p600 = process.env.STRIPE_PRICE_YEARLY_600;
  if (p200 && priceId === p200) return { planType: 'MONTHLY_200', months: 1, label: 'Monthly' };
  if (p400 && priceId === p400) return { planType: 'QUARTERLY_400', months: 3, label: 'Quarterly' };
  if (p600 && priceId === p600) return { planType: 'YEARLY_600', months: 12, label: 'Yearly' };
  return null;
}

// ── Status ────────────────────────────────────────────────────────────────────
export const getMySubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const now = new Date();
    // Active if isPremium is true AND (no expiryDate set yet OR expiryDate is in the future)
    const active = Boolean(user.isPremium && (!user.expiryDate || user.expiryDate > now));
    return res.status(200).json({
      active,
      planType: user.planType,
      subscriptionId: user.subscriptionId,
      expiryDate: user.expiryDate,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to fetch subscription status', error: error.message });
  }
};

// ── Payment History ───────────────────────────────────────────────────────────
export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const records = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return res.status(200).json({ history: records });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to fetch payment history', error: error.message });
  }
};

// ── Create Checkout Session ───────────────────────────────────────────────────
export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const stripe = getStripeClient();
    if (!stripe) return res.status(503).json({ message: 'Stripe is not configured. Set STRIPE_SECRET_KEY in backend .env' });

    const { priceId } = req.body as { priceId?: string };
    if (!priceId || typeof priceId !== 'string') return res.status(400).json({ message: 'priceId is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    let customerId = user.stripeCustomerId || '';
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/subscription-result?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscription-result?canceled=1`,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: user.id, priceId } },
      metadata: { userId: user.id, priceId }
    });

    return res.status(201).json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to create checkout session', error: error.message });
  }
};

// ── Sync Session (called immediately after Stripe redirect) ───────────────────
export const syncSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const stripe = getStripeClient();
    if (!stripe) return res.status(503).json({ message: 'Stripe is not configured' });

    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

    const session: any = await stripe.checkout.sessions.retrieve(sessionId);

    // Security: only verify if client_reference_id is present (it may be null in some API versions)
    if (session.client_reference_id && session.client_reference_id !== req.user.id) {
      return res.status(403).json({ message: 'Session does not belong to this user' });
    }

    // Use session.status === 'complete' (correct check for subscriptions)
    if (session.status !== 'complete' || !session.subscription) {
      return res.status(200).json({ synced: false, message: `Session not complete (status: ${session.status})` });
    }

    // Retrieve subscription separately — more reliable than expand
    const subId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as any)?.id;
    const sub: any = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price'] });

    const priceId: string = sub.items?.data[0]?.price?.id || '';
    const mapped = planTypeFromPriceId(priceId);

    // current_period_end may be absent in newer Stripe API versions — calculate fallback from plan months
    const rawPeriodEnd: number | null = (sub as any).current_period_end ?? null;
    const expiryDate: Date = rawPeriodEnd
      ? new Date(rawPeriodEnd * 1000)
      : (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + (mapped?.months ?? 1));
          return d;
        })();
    const customerId: string = typeof sub.customer === 'string' ? sub.customer : (sub.customer as any)?.id || '';

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        isPremium: true,
        planType: mapped?.planType || null,
        subscriptionId: sub.id,
        expiryDate,
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        stripeCustomerId: customerId || undefined
      }
    });

    // Record payment — ignore duplicate (user might refresh the page)
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : `sess_${session.id}`;

    await prisma.subscription.upsert({
      where: { stripePaymentIntentId: paymentIntentId },
      update: { status: 'active', currentPeriodEnd: expiryDate || undefined },
      create: {
        userId: req.user.id,
        planMonths: mapped?.months || 0,
        amount: Math.round((session.amount_total || 0) / 100),
        stripePaymentIntentId: paymentIntentId,
        status: 'active',
        stripeCustomerId: customerId || undefined,
        stripeSubscriptionId: sub.id,
        currentPeriodEnd: expiryDate || undefined
      }
    });

    return res.status(200).json({
      synced: true,
      active: true,
      planType: mapped?.planType || null,
      subscriptionId: sub.id,
      expiryDate: expiryDate?.toISOString() || null,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end)
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to sync session', error: error.message });
  }
};

// ── Cancel ────────────────────────────────────────────────────────────────────
export const cancelMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const stripe = getStripeClient();
    if (!stripe) return res.status(503).json({ message: 'Stripe is not configured' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.subscriptionId) return res.status(400).json({ message: 'No active subscription to cancel' });

    const canceled: any = await stripe.subscriptions.update(user.subscriptionId, { cancel_at_period_end: true });

    await prisma.user.update({ where: { id: req.user.id }, data: { cancelAtPeriodEnd: true } });

    return res.status(200).json({
      message: 'Subscription will cancel at period end',
      cancelAtPeriodEnd: true,
      expiryDate: canceled.current_period_end
        ? new Date((canceled.current_period_end as number) * 1000).toISOString()
        : null
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to cancel subscription', error: error.message });
  }
};

// ── Reactivate ────────────────────────────────────────────────────────────────
export const reactivateMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const stripe = getStripeClient();
    if (!stripe) return res.status(503).json({ message: 'Stripe is not configured' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.subscriptionId) return res.status(400).json({ message: 'No subscription found' });
    if (!user.cancelAtPeriodEnd) return res.status(400).json({ message: 'Subscription is not scheduled for cancellation' });

    await stripe.subscriptions.update(user.subscriptionId, { cancel_at_period_end: false });
    await prisma.user.update({ where: { id: req.user.id }, data: { cancelAtPeriodEnd: false } });

    return res.status(200).json({ message: 'Subscription reactivated', cancelAtPeriodEnd: false });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to reactivate subscription', error: error.message });
  }
};

// ── Stripe Webhook ────────────────────────────────────────────────────────────
export const stripeWebhook = async (req: any, res: Response) => {
  const stripe = getStripeClient();
  if (!stripe) return res.status(503).json({ message: 'Stripe not configured' });

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === 'whsec_xxx') return res.status(500).json({ message: 'Missing STRIPE_WEBHOOK_SECRET' });
  if (!sig) return res.status(400).json({ message: 'Missing stripe-signature header' });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice: any = event.data.object;
        const subscriptionId = (invoice.subscription as string) || '';
        const customerId = (invoice.customer as string) || '';

        const subscription: any = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ['items.data.price']
        });
        const priceId = subscription.items.data[0]?.price?.id || '';
        const mapped = planTypeFromPriceId(priceId);
        const rawEnd: number | null = (subscription as any).current_period_end ?? null;
        const expiryDate = rawEnd
          ? new Date(rawEnd * 1000)
          : (() => { const d = new Date(); d.setMonth(d.getMonth() + (mapped?.months ?? 1)); return d; })();

        const userId = (subscription.metadata?.userId as string) || (invoice.metadata?.userId as string) || '';
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { isPremium: true, planType: mapped?.planType || null, subscriptionId, expiryDate, cancelAtPeriodEnd: false, stripeCustomerId: customerId || undefined }
          });

          const paymentIntentId = invoice.payment_intent ? String(invoice.payment_intent) : `inv_${invoice.id}`;
          await prisma.subscription.upsert({
            where: { stripePaymentIntentId: paymentIntentId },
            update: { status: 'active', currentPeriodEnd: expiryDate || undefined },
            create: {
              userId,
              planMonths: mapped?.months || 0,
              amount: Math.round((invoice.amount_paid || 0) / 100),
              stripePaymentIntentId: paymentIntentId,
              status: 'active',
              stripeCustomerId: customerId || undefined,
              stripeSubscriptionId: subscriptionId || undefined,
              currentPeriodEnd: expiryDate || undefined
            }
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice: any = event.data.object;
        const subscriptionId = (invoice.subscription as string) || '';
        const customerId = (invoice.customer as string) || '';
        if (subscriptionId) {
          await prisma.user.updateMany({
            where: { subscriptionId },
            data: { isPremium: false }
          });

          // Record the failed payment for billing history
          const paymentIntentId = invoice.payment_intent ? String(invoice.payment_intent) : `fail_${invoice.id}`;
          await prisma.subscription.upsert({
            where: { stripePaymentIntentId: paymentIntentId },
            update: { status: 'failed' },
            create: {
              userId: invoice.metadata?.userId || '',
              planMonths: 0,
              amount: Math.round((invoice.amount_due || 0) / 100),
              stripePaymentIntentId: paymentIntentId,
              status: 'failed',
              stripeCustomerId: customerId || undefined,
              stripeSubscriptionId: subscriptionId || undefined
            }
          }).catch(() => {});
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        await prisma.user.updateMany({
          where: { subscriptionId: sub.id },
          data: {
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            expiryDate: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined
          }
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await prisma.user.updateMany({
          where: { subscriptionId: sub.id },
          data: { isPremium: false, planType: null, subscriptionId: null, expiryDate: null, cancelAtPeriodEnd: false }
        });
        break;
      }
      default:
        break;
    }
    return res.json({ received: true });
  } catch (e: any) {
    return res.status(500).json({ message: 'Webhook handler failed', error: e.message });
  }
};
