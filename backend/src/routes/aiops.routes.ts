import { Router } from 'express';
import {
  getDailySummary,
  getWeeklySummary,
  generateRCA,
  explainCostAnomaly,
  correlateIncidents,
} from '../controllers/aiops.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/daily-summary', authenticate, getDailySummary);
router.get('/weekly-summary', authenticate, getWeeklySummary);
router.post('/rca/:incident_id', authenticate, generateRCA);
router.post('/explain-cost-anomaly', authenticate, explainCostAnomaly);
router.get('/correlate-incidents', authenticate, correlateIncidents);

export default router;
