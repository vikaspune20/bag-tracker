import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { sendTrackingUpdateEmail } from '../utils/email';

export const addTrackingEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { bagId, status, airportLocation, remarks } = req.body;
    
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Only admins can add tracking events' });

    const bag = await prisma.bag.findUnique({
      where: { id: bagId },
      include: { trip: true }
    });

    if (!bag) return res.status(404).json({ message: 'Bag not found' });

    const newEvent = await prisma.trackingLog.create({
      data: {
        bagId,
        status,
        airportLocation,
        remarks
      }
    });

    // Create Notification for the user
    await prisma.notification.create({
        data: {
            userId: bag.trip.userId,
            bagId: bag.id,
            message: `Your bag (${bag.tagNumber}) status changed to ${status}${airportLocation ? ` at ${airportLocation}` : ''}.`,
            type: 'BAGGAGE_UPDATE'
        }
    });

    // Best-effort email
    const owner = await prisma.user.findUnique({ where: { id: bag.trip.userId } });
    if (owner) {
      sendTrackingUpdateEmail(owner.email, owner.fullName, {
        tagNumber: bag.tagNumber,
        status,
        airportLocation,
        remarks,
      }).catch(() => {});
    }

    res.status(201).json({ event: newEvent });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding tracking event', error: error.message });
  }
};

export const getBagTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const { bagId } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const bag = await prisma.bag.findUnique({
      where: { id: bagId },
      include: { trip: true }
    });
    if (!bag) return res.status(404).json({ message: 'Bag not found' });
    if (bag.trip.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const events = await prisma.trackingLog.findMany({
      where: { bagId },
      orderBy: { timestamp: 'asc' }
    });

    res.status(200).json({ events });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching timeline', error: error.message });
  }
};

// ── Mobile GPS ping — no JWT auth, authenticated by deviceId ─────────────────
export const mobilePing = async (req: Request, res: Response) => {
  try {
    const { deviceId, latitude, longitude, accuracy, status: pingStatus } = req.body;

    if (!deviceId) return res.status(400).json({ message: 'deviceId is required' });
    if (latitude == null || longitude == null) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    // Find the device
    const device = await prisma.trackingDevice.findUnique({
      where: { deviceId },
      include: { user: true },
    });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    if (device.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'Device is not active' });
    }

    // Find the bag this device is assigned to (tagNumber = deviceId)
    const bag = await prisma.bag.findFirst({
      where: { tagNumber: deviceId },
      include: { trip: true },
    });
    if (!bag) {
      return res.status(404).json({ message: 'No bag is currently assigned to this device. Assign the device to a bag first.' });
    }

    // Build a human-readable location label from coordinates
    const latDir  = latitude  >= 0 ? 'N' : 'S';
    const lonDir  = longitude >= 0 ? 'E' : 'W';
    const locLabel = `${Math.abs(latitude).toFixed(5)}°${latDir}, ${Math.abs(longitude).toFixed(5)}°${lonDir}`;

    const event = await prisma.trackingLog.create({
      data: {
        bagId:           bag.id,
        status:          pingStatus || 'In Transit',
        airportLocation: locLabel,
        remarks:         `GPS ping from mobile${accuracy != null ? ` (±${Math.round(accuracy)}m)` : ''}`,
        latitude:        parseFloat(latitude),
        longitude:       parseFloat(longitude),
        accuracy:        accuracy != null ? parseFloat(accuracy) : null,
        source:          'MOBILE_GPS',
      },
    });

    // Notify user (best-effort, don't flood — only if last ping was >5 min ago)
    try {
      const recent = await prisma.trackingLog.findFirst({
        where: { bagId: bag.id, source: 'MOBILE_GPS' },
        orderBy: { timestamp: 'desc' },
        skip: 1, // skip the one we just created
      });
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (!recent || new Date(recent.timestamp) < fiveMinutesAgo) {
        await prisma.notification.create({
          data: {
            userId:  device.userId,
            bagId:   bag.id,
            message: `GPS update: bag ${bag.tagNumber} is at ${locLabel}`,
            type:    'BAGGAGE_UPDATE',
          },
        });
      }
    } catch { /* non-critical */ }

    return res.status(201).json({ ok: true, event });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error recording GPS ping', error: error.message });
  }
};

// ── Get latest GPS position for a bag ────────────────────────────────────────
export const getLatestGps = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const device = await prisma.trackingDevice.findUnique({ where: { deviceId } });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const bag = await prisma.bag.findFirst({ where: { tagNumber: deviceId } });
    if (!bag) return res.status(404).json({ message: 'No bag assigned to this device' });

    const latest = await prisma.trackingLog.findFirst({
      where:   { bagId: bag.id, source: 'MOBILE_GPS' },
      orderBy: { timestamp: 'desc' },
    });

    return res.status(200).json({ position: latest });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching GPS', error: error.message });
  }
};

export const getTrackingByTag = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { tag } = req.params;
    const bag = await prisma.bag.findFirst({
      where: { tagNumber: tag },
      include: { trip: true }
    });
    if (!bag) return res.status(404).json({ message: 'Bag not found' });
    if (bag.trip.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const events = await prisma.trackingLog.findMany({
      where: { bagId: bag.id },
      orderBy: { timestamp: 'asc' }
    });
    return res.status(200).json({ bag, events });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching tracking details', error: error.message });
  }
};
