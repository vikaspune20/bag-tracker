import { Router } from 'express';
import { submitEnquiry } from '../controllers/contact.controller';

const router = Router();

// Public — no authentication required
router.post('/', submitEnquiry);

export default router;
