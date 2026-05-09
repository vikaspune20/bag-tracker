import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../utils/prisma';
import { attachDeviceField, validateDeviceTag } from '../utils/deviceLink';
import { createNotification } from '../utils/notify';
import { sendTripCreatedEmail } from '../utils/email';

export const createTrip = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      flightNumber,
      airlineName,
      departureAirport,
      destinationAirport,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      bags
    } = req.body;

    if (
      !flightNumber ||
      !airlineName ||
      !departureAirport ||
      !destinationAirport ||
      !departureDate ||
      !departureTime ||
      !arrivalDate ||
      !arrivalTime
    ) {
      return res.status(400).json({ message: "Missing required trip fields" });
    }

    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}`);

    if (isNaN(departureDateTime.getTime()) || isNaN(arrivalDateTime.getTime())) {
      return res.status(400).json({ message: "Invalid date/time format" });
    }

    let parsedBags: any[] = [];

    try {
      parsedBags = bags ? JSON.parse(bags) : [];
    } catch {
      return res.status(400).json({ message: "Invalid bags JSON format" });
    }

    if (parsedBags.length === 0) {
      return res.status(400).json({
        message: "Trip must contain at least one bag"
      });
    }

    const seenDeviceTags = new Set<string>();
    for (let i = 0; i < parsedBags.length; i++) {
      const tag = String(parsedBags[i].tagNumber || '').trim();
      if (!tag) return res.status(400).json({ message: `Bag #${i + 1} is missing a tag number` });
      if (seenDeviceTags.has(tag)) {
        return res.status(400).json({ message: `Duplicate tag number "${tag}" within this trip` });
      }
      seenDeviceTags.add(tag);
    }

    const files = (req.files as Express.Multer.File[]) || [];

    const result = await prisma.$transaction(async (tx) => {

      for (let i = 0; i < parsedBags.length; i++) {
        const tag = String(parsedBags[i].tagNumber).trim();
        const check = await validateDeviceTag({ tagNumber: tag, userId: req.user!.id, tx });
        if (!check.ok) {
          throw new Error(`Bag #${i + 1}: ${check.reason}`);
        }
      }

      const trip = await tx.trip.create({
        data: {
          userId: req.user!.id,
          flightNumber,
          airlineName,
          departureAirport,
          destinationAirport,
          departureDateTime,
          arrivalDateTime
        }
      });

      const createdBags = [];

      for (let i = 0; i < parsedBags.length; i++) {

        const bagData = parsedBags[i];

        const file = files.find(f => f.fieldname === `image_${i}`);

        const imagePath = file ? `/uploads/${file.filename}` : null;

        const bag = await tx.bag.create({
          data: {
            tripId: trip.id,
            tagNumber: String(bagData.tagNumber).trim(),
            weightLbs: Number(bagData.weight),
            description: bagData.description ?? "",
            imagePath
          }
        });

        await tx.trackingLog.create({
          data: {
            bagId: bag.id,
            status: "Checked-in",
            airportLocation: departureAirport,
            remarks: "Bag checked in during trip creation"
          }
        });

        createdBags.push(bag);
      }

      return { trip, bags: createdBags };
    });

    const enrichedBags = await attachDeviceField(result.bags, req.user.id);

    // Side-effects: trip-update notification + email (best effort).
    const userRow = await prisma.user.findUnique({ where: { id: req.user.id } });
    const flightLabel = `${result.trip.flightNumber} (${result.trip.departureAirport} → ${result.trip.destinationAirport})`;
    createNotification({
      userId: req.user.id,
      type: 'TRIP_UPDATE',
      message: `Trip ${flightLabel} registered with ${enrichedBags.length} bag${enrichedBags.length === 1 ? '' : 's'}.`,
    }).catch(() => {});
    if (userRow) {
      sendTripCreatedEmail(userRow.email, userRow.fullName, {
        flightNumber: result.trip.flightNumber,
        departureAirport: result.trip.departureAirport,
        destinationAirport: result.trip.destinationAirport,
        departureDateTime: result.trip.departureDateTime,
      }).catch(() => {});
    }

    return res.status(201).json({
      message: "Trip created successfully",
      data: { trip: result.trip, bags: enrichedBags }
    });

  } catch (error: any) {

    console.error("createTrip error:", error);

    const status = /^Bag #/.test(error.message || '') ? 400 : 500;
    return res.status(status).json({
      message: status === 400 ? error.message : "Failed to create trip",
      error: error.message
    });

  }
};

export const getTrips = async (req: AuthRequest, res: Response) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const trips = await prisma.trip.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        bags: {
          include: {
            trackingLogs: {
              orderBy: { timestamp: "desc" },
              take: 1
            }
          }
        }
      },
      orderBy: {
        departureDateTime: "desc"
      }
    });

    const allBags = trips.flatMap((t) => t.bags);
    const enriched = await attachDeviceField(allBags, req.user.id);
    const byBagId = new Map(enriched.map((b) => [b.id, b]));
    const tripsOut = trips.map((t) => ({
      ...t,
      bags: t.bags.map((b) => byBagId.get(b.id) || { ...b, device: null }),
    }));

    return res.status(200).json({
      trips: tripsOut
    });

  } catch (error: any) {

    console.error("getTrips error:", error);

    return res.status(500).json({
      message: "Failed to fetch trips",
      error: error.message
    });

  }
};

export const getTripById = async (req: AuthRequest, res: Response) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        bags: {
          include: {
            trackingLogs: {
              orderBy: { timestamp: "desc" }
            }
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    if (trip.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const enrichedBags = await attachDeviceField(trip.bags, trip.userId);

    return res.status(200).json({
      data: { ...trip, bags: enrichedBags }
    });

  } catch (error: any) {

    console.error("getTripById error:", error);

    return res.status(500).json({
      message: "Failed to fetch trip",
      error: error.message
    });

  }
};

export const deleteTrip = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    if (trip.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Cascade: delete tracking logs → bags → trip
    await prisma.$transaction([
      prisma.trackingLog.deleteMany({ where: { bag: { tripId: id } } }),
      prisma.bag.deleteMany({ where: { tripId: id } }),
      prisma.trip.delete({ where: { id } }),
    ]);
    return res.status(200).json({ message: 'Trip deleted' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete trip', error: error.message });
  }
};
