import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { attachDeviceField, validateDeviceTag } from '../utils/deviceLink';

// Configure Multer for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
export const upload = multer({ storage });

export const addBag = async (req: AuthRequest, res: Response) => {
  try {
    const { tripId, tagNumber, weight, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!tagNumber || !String(tagNumber).trim()) {
      return res.status(400).json({ message: 'tagNumber is required' });
    }

    const tag = String(tagNumber).trim();

    // Ensure the trip exists and belongs to the user
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const check = await validateDeviceTag({ tagNumber: tag, userId: req.user.id });
    if (!check.ok) return res.status(400).json({ message: check.reason });

    const bag = await prisma.bag.create({
      data: {
        tripId,
        tagNumber: tag,
        weightLbs: parseFloat(weight),
        description: description || '',
        imagePath
      }
    });

    // Create initial tracking event
    await prisma.trackingLog.create({
      data: {
        bagId: bag.id,
        status: 'Checked-in',
        airportLocation: trip.departureAirport,
        remarks: 'Bag added and checked in.'
      }
    });

    const [enriched] = await attachDeviceField([bag], req.user.id);
    res.status(201).json({ bag: enriched });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding bag', error: error.message });
  }
};

export const getBags = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const bags = await prisma.bag.findMany({
      where: { trip: { userId: req.user.id } },
      include: { trackingLogs: { orderBy: { timestamp: 'desc' } }, trip: true },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = await attachDeviceField(bags, req.user.id);
    res.status(200).json({ bags: enriched });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching bags', error: error.message });
  }
};

export const getBagById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const bag = await prisma.bag.findUnique({
      where: { id },
      include: { trackingLogs: { orderBy: { timestamp: 'asc' } }, trip: true }
    });

    if (!bag) return res.status(404).json({ message: 'Bag not found' });
    if (bag.trip.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const [enriched] = await attachDeviceField([bag], bag.trip.userId);
    res.status(200).json({ bag: enriched });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching bag', error: error.message });
  }
};

export const updateBag = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const { tagNumber, description, weight } = req.body as {
      tagNumber?: string;
      description?: string;
      weight?: number | string;
    };

    const bag = await prisma.bag.findUnique({ where: { id }, include: { trip: true } });
    if (!bag) return res.status(404).json({ message: 'Bag not found' });
    if (bag.trip.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const data: Record<string, any> = {};
    if (tagNumber !== undefined) {
      const tag = String(tagNumber).trim();
      if (!tag) return res.status(400).json({ message: 'tagNumber cannot be empty' });
      if (tag !== bag.tagNumber) {
        const check = await validateDeviceTag({
          tagNumber: tag,
          userId: req.user.id,
          excludeBagId: bag.id,
        });
        if (!check.ok) return res.status(400).json({ message: check.reason });
      }
      data.tagNumber = tag;
    }
    if (description !== undefined) data.description = description;
    if (weight !== undefined) data.weightLbs = Number(weight);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    const updated = await prisma.bag.update({ where: { id }, data });
    const [enriched] = await attachDeviceField([updated], req.user.id);
    return res.status(200).json({ bag: enriched });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error updating bag', error: error.message });
  }
};

export const deleteBag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const bag = await prisma.bag.findUnique({ where: { id }, include: { trip: true } });
    if (!bag) return res.status(404).json({ message: 'Bag not found' });

    if (bag.trip.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.trackingLog.deleteMany({ where: { bagId: id } });
    await prisma.notification.deleteMany({ where: { bagId: id } });
    await prisma.bag.delete({ where: { id } });

    res.status(200).json({ message: 'Bag deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting bag', error: error.message });
  }
};
