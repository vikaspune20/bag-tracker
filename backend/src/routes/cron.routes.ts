import { Router } from 'express';
import { runExpiryReminders } from '../controllers/cron.controller';

const router = Router();

// Token-protected internal endpoint. Set CRON_SECRET in backend .env.
// Call from any external scheduler with: Authorization: Bearer <CRON_SECRET>
router.post('/run-expiry-reminders', runExpiryReminders);

export default router;
