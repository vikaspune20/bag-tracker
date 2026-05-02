import { Router } from 'express';
import { createTrip, getTrips, getTripById } from '../controllers/trip.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requirePremium } from '../middlewares/premium.middleware';
import { requireOwnedDevice } from '../middlewares/device.middleware';
import { upload } from '../controllers/bag.controller';

const router = Router();

router.use(authenticateToken); // Protect all trip routes

router.post('/', requirePremium, requireOwnedDevice, upload.any(), createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);

export default router;
