import { Router } from 'express';
import {
  getIntegrationStatus,
  testIntegration,
  getSyncLogs,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

router.get('/integrations', authenticate, authorize(UserRole.MANAGER), getIntegrationStatus);
router.post('/integrations/:integration/test', authenticate, authorize(UserRole.MANAGER), testIntegration);
router.get('/sync-logs', authenticate, authorize(UserRole.MANAGER), getSyncLogs);

export default router;
