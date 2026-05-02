import { Response } from 'express';
import crypto from 'crypto';
import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  DEVICE_CATALOG,
  DEVICE_HARDWARE_DAYS,
  FREE_BONUS_DAYS,
  getProductBySku,
} from '../config/devices.catalog';
import { syncUserPremiumFromDevices } from '../utils/premiumSync';
import { sendDeviceOrderConfirmationEmail } from '../utils/email';

const getStripeClient = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-08-27.basil' as any });
};

function getAppUrl() {
  return process.env.APP_URL || 'http://localhost:5173';
}

function newDeviceId() {
  return `JC-DEV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ── Catalog ───────────────────────────────────────────────────────────────────
export const getCatalog = async (_req: AuthRequest, res: Response) => {
  return res.status(200).json({ products: DEVICE_CATALOG });
};

// ── Checkout Session ──────────────────────────────────────────────────────────
export const createDeviceCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const stripe = getStripeClient();
    if (!stripe)
      return res.status(503).json({ message: 'Stripe is not configured. Set STRIPE_SECRET_KEY in backend .env' });

    const { sku, quantity, shipping } = req.body as {
      sku?: string;
      quantity?: number;
      shipping?: {
        name?: string;
        phone?: string;
        addressLine?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
      };
    };

    const product = sku ? getProductBySku(sku) : undefined;
    if (!product) return res.status(400).json({ message: 'Unknown product sku' });
    const qty = Math.max(1, Math.min(10, Number(quantity) || 1));

    const requiredShipping = ['name', 'phone', 'addressLine', 'city', 'state', 'zip'] as const;
    for (const f of requiredShipping) {
      if (!shipping || !shipping[f] || String(shipping[f]).trim() === '') {
        return res.status(400).json({ message: `Shipping ${f} is required` });
      }
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    let customerId = user.stripeCustomerId || '';
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const totalAmount = product.priceCents * qty;

    const order = await prisma.deviceOrder.create({
      data: {
        userId: user.id,
        productSku: product.sku,
        productName: product.name,
        quantity: qty,
        unitAmount: product.priceCents,
        totalAmount,
        currency: product.currency,
        status: 'PENDING',
        shippingName: shipping!.name!.trim(),
        shippingPhone: shipping!.phone!.trim(),
        shippingAddressLine: shipping!.addressLine!.trim(),
        shippingCity: shipping!.city!.trim(),
        shippingState: shipping!.state!.trim(),
        shippingZip: shipping!.zip!.trim(),
        shippingCountry: shipping!.country?.trim() || 'United States',
      },
    });

    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: { name: product.name, description: product.description },
            unit_amount: product.priceCents,
          },
          quantity: qty,
        },
      ],
      success_url: `${appUrl}/devices/order-result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/devices`,
      client_reference_id: user.id,
      metadata: { orderId: order.id, userId: user.id, kind: 'device_order' },
      payment_intent_data: { metadata: { orderId: order.id, userId: user.id, kind: 'device_order' } },
    });

    await prisma.deviceOrder.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return res.status(201).json({ url: session.url, orderId: order.id });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to create device checkout session', error: error.message });
  }
};

// ── Sync Session ──────────────────────────────────────────────────────────────
export const syncDeviceSession = async (req: AuthRequest, res: Response) => {
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

    const orderId: string | undefined = session.metadata?.orderId;
    if (!orderId) return res.status(400).json({ message: 'Session is missing orderId metadata' });

    const result = await fulfillDeviceOrder({
      orderId,
      session,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to sync device session', error: error.message });
  }
};

// ── List Devices ──────────────────────────────────────────────────────────────
export const listMyDevices = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const onlyAvailable = String(req.query.available || '') === 'true';

    const devices = await prisma.trackingDevice.findMany({
      where: { userId: req.user.id },
      orderBy: { purchasedAt: 'desc' },
    });

    const now = new Date();
    const enriched = await Promise.all(
      devices.map(async (d) => {
        const expired = d.expiresAt <= now;
        const status = expired ? 'EXPIRED' : d.status;
        const activeBag = await prisma.bag.findFirst({
          where: {
            tagNumber: d.deviceId,
            trip: {
              userId: req.user!.id,
              OR: [{ arrivalDateTime: null }, { arrivalDateTime: { gt: now } }],
            },
          },
          include: { trip: true },
          orderBy: { createdAt: 'desc' },
        });
        const available = !expired && status === 'ACTIVE' && !activeBag;
        return {
          id: d.id,
          deviceId: d.deviceId,
          status,
          purchasedAt: d.purchasedAt,
          expiresAt: d.expiresAt,
          available,
          attachedTo: activeBag
            ? {
                bagId: activeBag.id,
                tripId: activeBag.tripId,
                tagNumber: activeBag.tagNumber,
                tripFlight: activeBag.trip.flightNumber,
                tripDeparture: activeBag.trip.departureDateTime,
                tripArrival: activeBag.trip.arrivalDateTime,
              }
            : null,
        };
      })
    );

    const filtered = onlyAvailable ? enriched.filter((d) => d.available) : enriched;
    return res.status(200).json({ devices: filtered });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to fetch devices', error: error.message });
  }
};

// ── List Orders ───────────────────────────────────────────────────────────────
export const listMyDeviceOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const orders = await prisma.deviceOrder.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { devices: { select: { id: true, deviceId: true, expiresAt: true } } },
    });
    return res.status(200).json({ orders });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to fetch orders', error: error.message });
  }
};

// ── Invoice ───────────────────────────────────────────────────────────────────
export const getDeviceOrderInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const order = await prisma.deviceOrder.findUnique({
      where: { id },
      include: { devices: { select: { deviceId: true, expiresAt: true } }, user: true },
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
    return res.status(200).json({
      invoiceNumber,
      issuedAt: order.paidAt || order.createdAt,
      status: order.status,
      customer: {
        name: order.user.fullName,
        email: order.user.email,
        phone: order.user.phone,
      },
      shipping: {
        name: order.shippingName,
        phone: order.shippingPhone,
        addressLine: order.shippingAddressLine,
        city: order.shippingCity,
        state: order.shippingState,
        zip: order.shippingZip,
        country: order.shippingCountry,
      },
      lineItems: [
        {
          sku: order.productSku,
          name: order.productName,
          quantity: order.quantity,
          unitAmount: order.unitAmount,
          totalAmount: order.totalAmount,
          currency: order.currency,
        },
      ],
      totals: {
        subtotal: order.totalAmount,
        shipping: 0,
        tax: 0,
        total: order.totalAmount,
        currency: order.currency,
      },
      devices: order.devices,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Unable to fetch invoice', error: error.message });
  }
};

// ── Shared fulfillment used by sync-session and webhook ───────────────────────
export async function fulfillDeviceOrder(args: {
  orderId: string;
  session?: any;
  paymentIntentId?: string;
}): Promise<{ synced: boolean; order: any; devices: any[]; bonusGranted: boolean; message?: string }> {
  const { orderId, session } = args;
  const paymentIntentId =
    args.paymentIntentId ||
    (typeof session?.payment_intent === 'string' ? session.payment_intent : session?.payment_intent?.id) ||
    null;

  const order = await prisma.deviceOrder.findUnique({ where: { id: orderId } });
  if (!order) return { synced: false, order: null, devices: [], bonusGranted: false, message: 'Order not found' };

  if (session && session.status !== 'complete') {
    return {
      synced: false,
      order,
      devices: [],
      bonusGranted: false,
      message: `Session not complete (status: ${session.status})`,
    };
  }

  if (order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    const existing = await prisma.trackingDevice.findMany({ where: { orderId: order.id } });
    return { synced: true, order, devices: existing, bonusGranted: order.bonusGranted };
  }

  const result = await prisma.$transaction(async (tx) => {
    // Atomic guard: only the first concurrent caller transitions PENDING → PAID.
    // updateMany returns count=0 if status is no longer PENDING (another call won the race).
    const claimed = await tx.deviceOrder.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId || order.stripePaymentIntentId,
      },
    });

    if (claimed.count === 0) {
      // Already fulfilled by the concurrent call — return existing devices
      const existing = await tx.trackingDevice.findMany({ where: { orderId: order.id } });
      return { synced: true, order, devices: existing, bonusGranted: true, _alreadyDone: true };
    }

    const now = new Date();
    const hardwareExpiresAt = addDays(now, DEVICE_HARDWARE_DAYS);
    const bonusExpiry = addDays(now, FREE_BONUS_DAYS);

    const created = [];
    for (let i = 0; i < order.quantity; i++) {
      const dev = await tx.trackingDevice.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          deviceId: newDeviceId(),
          status: 'ACTIVE',
          purchasedAt: now,
          expiresAt: hardwareExpiresAt,
          subStatus: 'ACTIVE',
          subPlan: 'DEVICE_BONUS',
          subExpiry: bonusExpiry,
        },
      });
      created.push(dev);
    }

    await tx.deviceOrder.update({
      where: { id: order.id },
      data: { bonusGranted: true },
    });

    return {
      synced: true,
      order: { ...order, status: 'PAID', bonusGranted: true },
      devices: created,
      bonusGranted: true,
    };
  });

  // Sync User.isPremium cache from all device subscriptions (outside transaction)
  await syncUserPremiumFromDevices(order.userId).catch(() => {});

  // Send order confirmation email (best-effort)
  if (result.synced && result.devices.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { email: true, fullName: true },
    }).catch(() => null);
    if (user) {
      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
      sendDeviceOrderConfirmationEmail(user.email, user.fullName, {
        invoiceNumber,
        productName: order.productName,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        currency: order.currency,
        deviceIds: result.devices.map((d: any) => d.deviceId),
        invoiceUrl: `${appUrl}/orders/${order.id}/invoice`,
      }).catch(() => {});
    }
  }

  return result;
}
