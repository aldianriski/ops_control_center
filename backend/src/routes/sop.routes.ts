import { Router } from 'express';
import {
  getSOPs,
  getSOPById,
  createSOP,
  updateSOP,
} from '../controllers/sop.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.get('/', authenticate, getSOPs);
router.get('/:id', authenticate, getSOPById);
router.post('/', authenticate, authorize(UserRole.MANAGER), createSOP);
router.put('/:id', authenticate, authorize(UserRole.MANAGER), updateSOP);

export default router;
