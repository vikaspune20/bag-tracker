import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  cancelMySubscription,
  createCheckoutSession,
  getMySubscriptionStatus,
  getPaymentHistory,
  reactivateMySubscription,
  syncSession
} from '../controllers/subscription.controller';
import { requirePremium } from '../middlewares/premium.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/status', getMySubscriptionStatus);
router.get('/history', getPaymentHistory);
router.post('/checkout-session', createCheckoutSession);
router.post('/sync-session', syncSession);
router.post('/cancel', requirePremium, cancelMySubscription);
router.post('/reactivate', requirePremium, reactivateMySubscription);

export default router;
