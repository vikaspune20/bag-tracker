import { Response } from 'express';
import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { fulfillDeviceOrder } from './device.controller';
import { syncUserPremiumFromDevices } from '../utils/premiumSync';
import { sendDeviceSubConfirmationEmail } from '../utils/email';

const getStripeClient = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-08-27.basil' });
};

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:5173';
}

// ── Plan helpers ──────────────────────────────────────────────────────────────

type DeviceSubPlan = 'MONTHLY_200' | 'QUARTERLY_400' | 'YEARLY_600';

const PLAN_META: Record<DeviceSubPlan, { months: number; cents: number; label: string }> = {
  MONTHLY_200:  { months: 1,  cents: 20000, label: 'Monthly' },
  QUARTERLY_400:{ months: 3,  cents: 40000, label: 'Quarterly' },
  YEARLY_600:   { months: 12, cents: 60000, label: 'Yearly' },
};

function isDeviceSubPlan(v: string): v is DeviceSubPlan {
  return v in PLAN_META;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ── Internal helper: fulfill a device_sub checkout session ────────────────────
// Used by both syncDeviceSubSession (user-initiated) and the webhook.
export async function fulfillDeviceSubSession(session: any): Promise<void> {
  if (session.payment_status !== 'paid' && session.status !== 'complete') return;

  const rawSelections: string = session.metadata?.selections || '[]';
  let selections: { deviceId: string; plan: string }[] = [];
  try { selections = JSON.parse(rawSelections); } catch { return; }
  if (!selections.length) return;

  const userId: string = session.metadata?.userId || '';
  const paymentIntentId: string =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : `sess_${session.id}`;

  const now = new Date();

  for (const sel of selections) {
    if (!isDeviceSubPlan(sel.plan)) continue;
    const meta = PLAN_META[sel.plan];

    const device = await prisma.trackingDevice.findUnique({
      where: { id: sel.deviceId },
      select: { id: true, userId: true, subExpiry: true },
    });
    if (!device || device.userId !== userId) continue;

    const base = device.subExpiry && device.subExpiry > now ? device.subExpiry : now;
    const newExpiry = addMonths(base, meta.months);

    await prisma.trackingDevice.update({
      where: { id: sel.deviceId },
      data: {
        subStatus: 'ACTIVE',
        subPlan: sel.plan,
        subExpiry: newExpiry,
        subCancelAtPeriodEnd: false,
      },
    });

    // Record payment (upsert — webhook + sync-session may both run)
    const piKey = `${paymentIntentId}_${sel.deviceId}`;
    await prisma.subscription.upsert({
      where: { stripePaymentIntentId: piKey },
      update: { status: 'active', currentPeriodEnd: newExpiry },
      create: {
        userId,
        deviceId: sel.deviceId,
        planMonths: meta.months,
        amount: meta.cents / 100,
        stripePaymentIntentId: piKey,
        status: 'active',
        currentPeriodEnd: newExpiry,
      },
    });
  }

  if (userId) {
    await syncUserPremiumFromDevices(userId);

    // Send subscription confirmation email (best-effort)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    }).catch(() => null);
    if (user) {
      const confirmedDevices = await prisma.trackingDevice.findMany({
        where: { id: { in: selections.map((s: any) => s.deviceId) } },
        select: { deviceId: true, subPlan: true, subExpiry: true },
      }).catch(() => []);
      if (confirmedDevices.length > 0) {
        sendDeviceSubConfirmationEmail(
          user.email,
          user.fullName,
          confirmedDevices.map((d) => ({
            deviceId: d.deviceId,
            plan: d.subPlan ?? '',
            expiresAt: d.subExpiry ?? new Date(),
          }))
        ).catch(() => {});
      }
    }
  }
}

// ── Status ────────────────────────────────────────────────────────────────────
export const getMySubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const now = new Date();
    const active = Boolean(user.isPremium && (!user.expiryDate || user.expiryDate > now));

    const devices = await prisma.trackingDevice.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        deviceId: true,
        subStatus: true,
        subPlan: true,
        subExpiry: true,
        subCancelAtPeriodEnd: true,
        expiresAt: true,   // hardware expiry
      },
      orderBy: { purchasedAt: 'asc' },
    });

    return res.status(200).json({
      active,
      planType: user.planType,
      expiryDate: user.expiryDate,
      hasDevice: devices.length > 0,
      deviceCount: devices.length,
      devices: devices.map(d => ({
        id: d.id,
        deviceId: d.deviceId,
        subStatus: d.subStatus,
        subPlan: d.subPlan,
        subExpiry: d.subExpiry,
        subCancelAtPeriodEnd: d.subCancelAtPeriodEnd,
        hardwareExpiresAt: d.expiresAt,
      })),
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
      take: 30,
    });

    // Resolve TrackingDevice.deviceId (JC-DEV-...) for display
    const internalIds = records.map(r => r.deviceId).filter(Boolean) as string[];
    const deviceRows = internalIds.length
      ? await prisma.trackingDevice.findMany({
          where: { id: { in: internalIds } },
          select: { id: true, deviceId: true },
        })
      : [];
    const deviceMap = new Map(deviceRows.map(d => [d.id, d.deviceId]));

    const history = records.map(r => ({
      ...r,
      deviceTag: r.deviceId ? (deviceMap.get(r.deviceId) ?? null) : null,
    }));
    return res.status(200).json({ history });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to fetch payment history', error: error.message });
  }
};

// ── Subscription Invoice ──────────────────────────────────────────────────────
export const getSubscriptionInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!sub) return res.status(404).json({ message: 'Invoice not found' });
    if (sub.userId !== req.user.id) return res.status(403).json({ message: 'Access denied' });

    let deviceTag: string | null = null;
    if (sub.deviceId) {
      const dev = await prisma.trackingDevice.findUnique({
        where: { id: sub.deviceId },
        select: { deviceId: true },
      });
      deviceTag = dev?.deviceId ?? null;
    }

    let planLabel = 'Subscription';
    if (sub.planMonths === 1)  planLabel = 'Monthly Subscription (1 month)';
    else if (sub.planMonths === 3)  planLabel = 'Quarterly Subscription (3 months)';
    else if (sub.planMonths === 12) planLabel = 'Yearly Subscription (12 months)';

    const invoiceNumber = `SUBINV-${sub.id.slice(0, 8).toUpperCase()}`;
    const u = sub.user;

    return res.status(200).json({
      invoiceNumber,
      issuedAt: sub.createdAt,
      status: sub.status.toUpperCase(),
      customer: { name: u.fullName, email: u.email, phone: u.phone },
      device: deviceTag ? { deviceId: deviceTag } : null,
      lineItems: [
        {
          name: planLabel,
          description: deviceTag ? `Device: ${deviceTag}` : 'Subscription',
          quantity: 1,
          unitAmount: sub.amount,   // stored in dollars (e.g. 200)
          totalAmount: sub.amount,
        },
      ],
      totals: { subtotal: sub.amount, total: sub.amount },
      periodStart: sub.createdAt,
      periodEnd: sub.currentPeriodEnd,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to fetch subscription invoice', error: error.message });
  }
};

// ── Device Subscription — Create Checkout Session ────────────────────────────
export const createDeviceSubCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const stripe = getStripeClient();
    if (!stripe) return res.status(503).json({ message: 'Stripe is not configured. Set STRIPE_SECRET_KEY in backend .env' });

    const { selections } = req.body as {
      selections?: { deviceId: string; plan: string }[];
    };
    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ message: 'selections must be a non-empty array of { deviceId, plan }' });
    }

    // Validate each selection
    for (const sel of selections) {
      if (!sel.deviceId || !isDeviceSubPlan(sel.plan)) {
        return res.status(400).json({ message: `Invalid selection: deviceId and plan (MONTHLY_200 | QUARTERLY_400 | YEARLY_600) are required` });
      }
      const device = await prisma.trackingDevice.findUnique({
        where: { id: sel.deviceId },
        select: { userId: true, status: true },
      });
      if (!device || device.userId !== req.user.id) {
        return res.status(400).json({ message: `Device ${sel.deviceId} not found or does not belong to you` });
      }
      if (device.status !== 'ACTIVE') {
        return res.status(400).json({ message: `Device ${sel.deviceId} hardware has expired and cannot be subscribed` });
      }
    }

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: selections.map(sel => {
        const meta = PLAN_META[sel.plan as DeviceSubPlan];
        return {
          price_data: {
            currency: 'usd',
            unit_amount: meta.cents,
            product_data: { name: `${meta.label} Subscription — Device …${sel.deviceId.slice(-8)}` },
          },
          quantity: 1,
        };
      }),
      success_url: `${appUrl}/subscription-result?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscription?canceled=1`,
      client_reference_id: req.user.id,
      metadata: {
        kind: 'device_sub',
        userId: req.user.id,
        selections: JSON.stringify(selections),
      },
    });

    return res.status(201).json({ url: session.url });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to create checkout session', error: error.message });
  }
};

// ── Device Subscription — Sync Session (user-initiated post-checkout) ─────────
export const syncDeviceSubSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const stripe = getStripeClient();
    if (!stripe) return res.status(503).json({ message: 'Stripe is not configured' });

    const { sessionId } = req.body as { sessionId?: string };
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });

    const session: any = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.client_reference_id && session.client_reference_id !== req.user.id) {
      return res.status(403).json({ message: 'Session does not belong to this user' });
    }
    if (session.metadata?.kind !== 'device_sub') {
      return res.status(400).json({ message: 'Session is not a device subscription checkout' });
    }
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      return res.status(200).json({ synced: false, message: `Payment not yet complete (status: ${session.status}, payment: ${session.payment_status})` });
    }

    await fulfillDeviceSubSession(session);

    const updatedDevices = await prisma.trackingDevice.findMany({
      where: { userId: req.user.id },
      select: { id: true, deviceId: true, subStatus: true, subPlan: true, subExpiry: true },
    });

    return res.status(200).json({ synced: true, devices: updatedDevices });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to sync session', error: error.message });
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
      case 'checkout.session.completed': {
        const session: any = event.data.object;
        const kind = session?.metadata?.kind;
        if (kind === 'device_order' && session.metadata?.orderId) {
          await fulfillDeviceOrder({ orderId: session.metadata.orderId, session });
        } else if (kind === 'device_sub') {
          await fulfillDeviceSubSession(session);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent: any = event.data.object;
        if (intent?.metadata?.kind === 'device_order' && intent.metadata?.orderId) {
          await prisma.deviceOrder.update({
            where: { id: intent.metadata.orderId },
            data: { status: 'FAILED' },
          }).catch(() => {});
        }
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
