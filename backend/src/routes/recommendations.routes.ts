import { Router } from 'express';
import {
  getRecommendations,
  createRecommendation,
  updateRecommendationStatus,
} from '../controllers/recommendations.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.get('/', authenticate, getRecommendations);
router.post('/', authenticate, authorize(UserRole.MANAGER), createRecommendation);
router.patch('/:id/status', authenticate, updateRecommendationStatus);

export default router;
