import { Router } from 'express';
import { addBag, getBags, getBagById, updateBag, deleteBag, upload } from '../controllers/bag.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requirePremium } from '../middlewares/premium.middleware';
import { requireOwnedDevice } from '../middlewares/device.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', requirePremium, requireOwnedDevice, upload.single('image'), addBag);
router.get('/', getBags);
router.get('/:id', getBagById);
router.patch('/:id', requirePremium, updateBag);
router.delete('/:id', deleteBag);

export default router;
