import { Router } from 'express';
import { addTrackingEvent, getBagTimeline, getTrackingByTag } from '../controllers/tracking.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requirePremium } from '../middlewares/premium.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', addTrackingEvent);
router.get('/by-tag/:tag', requirePremium, getTrackingByTag);
router.get('/:bagId', requirePremium, getBagTimeline);

export default router;
