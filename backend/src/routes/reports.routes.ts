import { Router } from 'express';
import {
  getReports,
  generateWeeklyReport,
  generateMonthlyReport,
  downloadReport,
} from '../controllers/reports.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.get('/', authenticate, getReports);
router.post('/weekly/generate', authenticate, authorize(UserRole.MANAGER, UserRole.HEAD_OF_ENGINEERING), generateWeeklyReport);
router.post('/monthly/generate', authenticate, authorize(UserRole.MANAGER, UserRole.HEAD_OF_ENGINEERING), generateMonthlyReport);
router.get('/:id/download', authenticate, downloadReport);

export default router;
