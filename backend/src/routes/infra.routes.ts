import { Router } from 'express';
import {
  getIncidents,
  getTasks,
  getUptimeRequests,
  getSLAMetrics,
} from '../controllers/infra.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/incidents', authenticate, getIncidents);
router.get('/tasks', authenticate, getTasks);
router.get('/uptime', authenticate, getUptimeRequests);
router.get('/sla', authenticate, getSLAMetrics);

export default router;
