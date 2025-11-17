import { Router } from 'express';
import { getAssets, createAsset, updateAsset } from '../controllers/assets.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getAssets);
router.post('/', authenticate, createAsset);
router.put('/:id', authenticate, updateAsset);

export default router;
