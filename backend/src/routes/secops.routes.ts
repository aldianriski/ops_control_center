import { Router } from 'express';
import {
  getVulnerabilities,
  getSecurityIncidents,
} from '../controllers/secops.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/vulnerabilities', authenticate, getVulnerabilities);
router.get('/incidents', authenticate, getSecurityIncidents);

export default router;
