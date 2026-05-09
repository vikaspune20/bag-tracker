import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import {
  getAdminStats,
  getAdminUsers,
  getAdminUserDetail,
  updateUserRole,
  purgeUserDataEndpoint,
  deleteUserAccount,
  getUserDataCounts,
  getAdminDevices,
  activateDevice,
  deactivateDevice,
  setDeviceSubscription,
  getAdminOrders,
  updateOrderStatus,
  getAdminSubscriptions,
  getAdminEnquiries,
  updateEnquiry,
  adminAddTracking,
  adminSearchBag,
  broadcastNotification,
  getPricing,
  updatePricing,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticateToken, requireAdmin);

// Stats
router.get('/stats', getAdminStats);

// Users
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserDetail);
router.put('/users/:id/role', updateUserRole);
router.get('/users/:id/data-counts', getUserDataCounts);
router.delete('/users/:id/data', purgeUserDataEndpoint);
router.delete('/users/:id', deleteUserAccount);

// Devices
router.get('/devices', getAdminDevices);
router.put('/devices/:id/activate', activateDevice);
router.put('/devices/:id/deactivate', deactivateDevice);
router.put('/devices/:id/subscription', setDeviceSubscription);

// Orders
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Subscriptions
router.get('/subscriptions', getAdminSubscriptions);

// Enquiries
router.get('/enquiries', getAdminEnquiries);
router.put('/enquiries/:id', updateEnquiry);

// Tracking
router.post('/tracking', adminAddTracking);
router.get('/tracking/bag', adminSearchBag);

// Notifications
router.post('/notifications/broadcast', broadcastNotification);

// Pricing
router.get('/pricing', getPricing);
router.put('/pricing', updatePricing);

export default router;
