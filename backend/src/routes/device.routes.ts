import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import {
  getCatalog,
  createDeviceCheckoutSession,
  syncDeviceSession,
  listMyDevices,
  listMyDeviceOrders,
  getDeviceOrderInvoice,
} from '../controllers/device.controller';

const router = Router();

router.use(authenticateToken);

router.get('/catalog', getCatalog);
router.get('/', listMyDevices);
router.get('/orders', listMyDeviceOrders);
router.get('/orders/:id/invoice', getDeviceOrderInvoice);
router.post('/checkout-session', createDeviceCheckoutSession);
router.post('/sync-session', syncDeviceSession);

export default router;
