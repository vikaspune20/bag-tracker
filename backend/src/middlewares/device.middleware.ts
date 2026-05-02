import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from './auth.middleware';

/**
 * Blocks the request unless the authenticated user has at least one
 * TrackingDevice on file. Trip / Bag creation depends on owning a device.
 * Responds with 402 (consistent with requirePremium) so the frontend can
 * route both to a single "buy device or subscribe" gate.
 */
export async function requireOwnedDevice(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const count = await prisma.trackingDevice.count({ where: { userId: req.user.id } });
    if (count === 0) {
      return res.status(402).json({
        message: 'Buy a tracking device to start adding trips and bags.',
        reason: 'NO_DEVICE',
      });
    }
    return next();
  } catch (e: any) {
    return res.status(500).json({ message: 'Unable to verify device ownership' });
  }
}
