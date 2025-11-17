import { Router } from 'express';
import { getEvidence, createEvidence, getInfraMetrics } from '../controllers/evidence.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/incident/:incident_id', authenticate, getEvidence);
router.post('/incident/:incident_id', authenticate, createEvidence);
router.get('/metrics', authenticate, getInfraMetrics);

export default router;
