import { Router } from 'express';
import {
  getFinOpsSummary,
  getCostBreakdown,
  getForecast,
  getICSCredits,
} from '../controllers/finops.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticate, getFinOpsSummary);
router.get('/costs', authenticate, getCostBreakdown);
router.get('/forecast', authenticate, getForecast);
router.get('/ics', authenticate, getICSCredits);

export default router;
