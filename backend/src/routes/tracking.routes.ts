import { Router } from 'express';
import { addTrackingEvent, getBagTimeline, getTrackingByTag, mobilePing, getLatestGps, sendMobileLink } from '../controllers/tracking.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requirePremium } from '../middlewares/premium.middleware';

const router = Router();

// ── Public endpoints (no JWT — authenticated by deviceId) ────────────────────
router.post('/mobile-ping', mobilePing);
router.get('/mobile-gps/:deviceId', getLatestGps);

// ── Authenticated endpoints ───────────────────────────────────────────────────
router.use(authenticateToken);

router.post('/', addTrackingEvent);
router.post('/send-mobile-link', sendMobileLink);
router.get('/by-tag/:tag', requirePremium, getTrackingByTag);
router.get('/:bagId', requirePremium, getBagTimeline);

export default router;
