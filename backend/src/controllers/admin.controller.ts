import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { syncUserPremiumFromDevices } from '../utils/premiumSync';
import { purgeUserData } from '../utils/purgeUser';
import { sendTrackingUpdateEmail } from '../utils/email';

// ── Helpers ───────────────────────────────────────────────────────────────────

function pageParams(query: any) {
  const page  = Math.max(1, parseInt(query.page  as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

const SAFE_USER_SELECT = {
  id: true, fullName: true, email: true, phone: true, address: true,
  city: true, state: true, zip: true, country: true,
  identificationNo: true, profilePicUrl: true, role: true,
  isPremium: true, planType: true, expiryDate: true,
  emailVerified: true, stripeCustomerId: true, createdAt: true, updatedAt: true,
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, premiumUsers, totalDevices, activeDeviceSubs,
      totalOrders, openEnquiries, revenueAgg, recentOrders] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.trackingDevice.count(),
      prisma.trackingDevice.count({ where: { subStatus: 'ACTIVE', subExpiry: { gt: new Date() } } }),
      prisma.deviceOrder.count(),
      prisma.contactEnquiry.count({ where: { status: 'OPEN' } }),
      prisma.subscription.aggregate({ _sum: { amount: true }, where: { status: 'active' } }),
      prisma.deviceOrder.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } },
      }),
    ]);

    return res.json({
      totalUsers,
      premiumUsers,
      totalDevices,
      activeDeviceSubs,
      totalOrders,
      openEnquiries,
      totalRevenue: revenueAgg._sum.amount ?? 0,
      recentOrders,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = pageParams(req.query);
    const search = (req.query.search as string || '').trim();

    const where = search ? {
      OR: [
        { fullName:    { contains: search, mode: 'insensitive' as const } },
        { email:       { contains: search, mode: 'insensitive' as const } },
        { phone:       { contains: search } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          ...SAFE_USER_SELECT,
          _count: { select: { trips: true, devices: true, subscriptions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ data: users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const getAdminUserDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...SAFE_USER_SELECT,
        trips: {
          orderBy: { departureDateTime: 'desc' },
          take: 30,
          include: {
            bags: { select: { id: true, tagNumber: true, weightLbs: true } },
          },
        },
        devices: { orderBy: { purchasedAt: 'desc' } },
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (id === req.user.id) return res.status(400).json({ message: 'Cannot change your own role' });
    if (!['USER', 'ADMIN'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: SAFE_USER_SELECT,
    });
    return res.json({ user: updated });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating role', error: error.message });
  }
};

export const purgeUserDataEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const deleted = await purgeUserData(id);
    return res.json({ message: 'User data purged successfully', deleted });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error purging user data', error: error.message });
  }
};

// ── Devices ───────────────────────────────────────────────────────────────────

export const getAdminDevices = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = pageParams(req.query);
    const status = req.query.status as string | undefined;

    const where = status ? { status } : {};

    const [devices, total] = await Promise.all([
      prisma.trackingDevice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchasedAt: 'desc' },
        include: {
          user:  { select: { id: true, fullName: true, email: true } },
          order: { select: { id: true, productName: true, totalAmount: true, paidAt: true } },
        },
      }),
      prisma.trackingDevice.count({ where }),
    ]);

    return res.json({ data: devices, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching devices', error: error.message });
  }
};

export const activateDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const device = await prisma.trackingDevice.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        expiresAt: oneYearLater,
        subStatus: 'ACTIVE',
        subPlan: 'DEVICE_BONUS',
        subExpiry: thirtyDaysLater,
        subCancelAtPeriodEnd: false,
      },
    });

    await syncUserPremiumFromDevices(device.userId);
    return res.json({ device });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error activating device', error: error.message });
  }
};

export const deactivateDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const device = await prisma.trackingDevice.update({
      where: { id },
      data: { status: 'EXPIRED', subStatus: 'EXPIRED' },
    });
    await syncUserPremiumFromDevices(device.userId);
    return res.json({ device });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error deactivating device', error: error.message });
  }
};

export const setDeviceSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { subStatus, subPlan, subExpiry } = req.body;

    const validStatuses = ['NONE', 'ACTIVE', 'EXPIRED'];
    const validPlans    = ['MONTHLY_200', 'QUARTERLY_400', 'YEARLY_600', 'DEVICE_BONUS'];

    if (subStatus && !validStatuses.includes(subStatus)) {
      return res.status(400).json({ message: 'Invalid subStatus' });
    }
    if (subPlan && !validPlans.includes(subPlan)) {
      return res.status(400).json({ message: 'Invalid subPlan' });
    }

    const device = await prisma.trackingDevice.update({
      where: { id },
      data: {
        ...(subStatus !== undefined && { subStatus }),
        ...(subPlan   !== undefined && { subPlan }),
        ...(subExpiry !== undefined && { subExpiry: subExpiry ? new Date(subExpiry) : null }),
      },
    });
    await syncUserPremiumFromDevices(device.userId);
    return res.json({ device });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating device subscription', error: error.message });
  }
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const getAdminOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = pageParams(req.query);
    const status = req.query.status as string | undefined;

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.deviceOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user:    { select: { id: true, fullName: true, email: true, phone: true } },
          devices: { select: { id: true, deviceId: true, status: true } },
        },
      }),
      prisma.deviceOrder.count({ where }),
    ]);

    return res.json({ data: orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, shippingTrackingNumber, shippingCarrier } = req.body;

    const allowed = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'FAILED', 'CANCELED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await prisma.deviceOrder.update({
      where: { id },
      data: {
        status,
        ...(shippingTrackingNumber !== undefined && { shippingTrackingNumber }),
        ...(shippingCarrier        !== undefined && { shippingCarrier }),
      },
    });
    return res.json({ order });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const getAdminSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = pageParams(req.query);

    const [records, total] = await Promise.all([
      prisma.subscription.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true, email: true } } },
      }),
      prisma.subscription.count(),
    ]);

    // Enrich with deviceTag
    const deviceIds = records.map(r => r.deviceId).filter(Boolean) as string[];
    const devices = deviceIds.length
      ? await prisma.trackingDevice.findMany({
          where: { id: { in: deviceIds } },
          select: { id: true, deviceId: true },
        })
      : [];
    const deviceMap = Object.fromEntries(devices.map(d => [d.id, d.deviceId]));

    const enriched = records.map(r => ({
      ...r,
      deviceTag: r.deviceId ? deviceMap[r.deviceId] ?? null : null,
    }));

    return res.json({ data: enriched, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
};

// ── Enquiries ─────────────────────────────────────────────────────────────────

export const getAdminEnquiries = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, skip } = pageParams(req.query);
    const status = req.query.status as string | undefined;
    const where  = status ? { status } : {};

    const [enquiries, total, openCount] = await Promise.all([
      prisma.contactEnquiry.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.contactEnquiry.count({ where }),
      prisma.contactEnquiry.count({ where: { status: 'OPEN' } }),
    ]);

    return res.json({ data: enquiries, total, openCount, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching enquiries', error: error.message });
  }
};

export const updateEnquiry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const valid = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
    if (status && !valid.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const enquiry = await prisma.contactEnquiry.update({
      where: { id },
      data: {
        ...(status    !== undefined && { status }),
        ...(adminNote !== undefined && { adminNote }),
      },
    });
    return res.json({ enquiry });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating enquiry', error: error.message });
  }
};

// ── Tracking (admin version — reuses tracking logic, route already guards ADMIN) ─

export const adminAddTracking = async (req: AuthRequest, res: Response) => {
  try {
    const { bagId, status, location, notes, airportLocation, remarks } = req.body;
    if (!bagId || !status) return res.status(400).json({ message: 'bagId and status are required' });

    const bag = await prisma.bag.findUnique({ where: { id: bagId }, include: { trip: true } });
    if (!bag) return res.status(404).json({ message: 'Bag not found' });

    // Accept both field naming conventions
    const loc  = location ?? airportLocation ?? null;
    const note = notes   ?? remarks          ?? null;

    const event = await prisma.trackingLog.create({
      data: { bagId, status, airportLocation: loc, remarks: note, source: 'MANUAL' },
    });

    await prisma.notification.create({
      data: {
        userId:  bag.trip.userId,
        bagId:   bag.id,
        message: `Your bag (${bag.tagNumber}) status changed to ${status}${loc ? ` at ${loc}` : ''}.`,
        type:    'BAGGAGE_UPDATE',
      },
    });

    const owner = await prisma.user.findUnique({ where: { id: bag.trip.userId } });
    if (owner) {
      sendTrackingUpdateEmail(owner.email, owner.fullName, {
        tagNumber: bag.tagNumber,
        status,
        airportLocation: loc,
        remarks: note,
      }).catch(() => {});
    }

    return res.status(201).json({ event });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error adding tracking event', error: error.message });
  }
};

// ── Broadcast Notification ────────────────────────────────────────────────────

export const broadcastNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { message, type, userIds } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required' });

    const users = Array.isArray(userIds) && userIds.length
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } })
      : await prisma.user.findMany({ select: { id: true } });

    await prisma.notification.createMany({
      data: users.map(u => ({
        userId:  u.id,
        message,
        type:    type || 'ADMIN_BROADCAST',
        isRead:  false,
      })),
    });

    return res.json({ sent: users.length });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error broadcasting notification', error: error.message });
  }
};

// ── Bag search by tag (for tracking manager) ──────────────────────────────────

export const adminSearchBag = async (req: AuthRequest, res: Response) => {
  try {
    const tag = (req.query.tag ?? req.params.tag) as string | undefined;
    if (!tag) return res.status(400).json({ message: 'tag query param required' });

    const bag = await prisma.bag.findFirst({
      where:   { tagNumber: { contains: tag, mode: 'insensitive' } },
      include: { trip: { include: { user: { select: { fullName: true, email: true } } } } },
    });
    if (!bag) return res.status(404).json({ message: 'Bag not found' });

    const logs = await prisma.trackingLog.findMany({
      where:   { bagId: bag.id },
      orderBy: { timestamp: 'asc' },
    });

    // Normalize field names for frontend
    const normalizedLogs = logs.map(l => ({
      id:        l.id,
      status:    l.status,
      location:  l.airportLocation ?? null,
      notes:     l.remarks ?? null,
      source:    l.source,
      createdAt: l.timestamp,
    }));

    return res.json({
      id:          bag.id,
      tagNumber:   bag.tagNumber,
      description: (bag as any).description ?? null,
      trip: {
        origin:       bag.trip.departureAirport,
        destination:  bag.trip.destinationAirport,
        flightNumber: bag.trip.flightNumber ?? null,
      },
      logs: normalizedLogs,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error searching bag', error: error.message });
  }
};

// ── User data counts (for purge preview) ─────────────────────────────────────

export const getUserDataCounts = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, fullName: true, email: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const trips = await prisma.trip.findMany({ where: { userId: id }, select: { id: true } });
    const tripIds = trips.map(t => t.id);
    const bags    = tripIds.length
      ? await prisma.bag.findMany({ where: { tripId: { in: tripIds } }, select: { id: true } })
      : [];

    const [bagCount, logCount, deviceCount, subCount, orderCount, notifCount] = await Promise.all([
      Promise.resolve(bags.length),
      bags.length ? prisma.trackingLog.count({ where: { bagId: { in: bags.map(b => b.id) } } }) : Promise.resolve(0),
      prisma.trackingDevice.count({ where: { userId: id } }),
      prisma.subscription.count({ where: { userId: id } }),
      prisma.deviceOrder.count({ where: { userId: id } }),
      prisma.notification.count({ where: { userId: id } }),
    ]);

    return res.json({
      trips:         trips.length,
      bags:          bagCount,
      trackingLogs:  logCount,
      devices:       deviceCount,
      subscriptions: subCount,
      orders:        orderCount,
      notifications: notifCount,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching data counts', error: error.message });
  }
};
