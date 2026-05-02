import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  getMySubscriptionStatus,
  getPaymentHistory,
  getSubscriptionInvoice,
  createDeviceSubCheckoutSession,
  syncDeviceSubSession,
} from '../controllers/subscription.controller';

const router = Router();

router.use(authenticateToken);
router.get('/status', getMySubscriptionStatus);
router.get('/history', getPaymentHistory);
router.get('/:id/invoice', getSubscriptionInvoice);
router.post('/device-checkout-session', createDeviceSubCheckoutSession);
router.post('/device-sync-session', syncDeviceSubSession);

export default router;
