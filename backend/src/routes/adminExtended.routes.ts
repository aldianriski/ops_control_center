import { Router } from 'express';
import {
  getAPITokens,
  createAPIToken,
  revokeAPIToken,
  getAlertThresholds,
  createAlertThreshold,
  updateAlertThreshold,
  getReportTemplates,
  createReportTemplate,
  updateReportTemplate,
  getEnvironments,
  getTeams,
} from '../controllers/adminExtended.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

const router = Router();

// API Tokens
router.get('/api-tokens', authenticate, getAPITokens);
router.post('/api-tokens', authenticate, createAPIToken);
router.delete('/api-tokens/:id', authenticate, revokeAPIToken);

// Alert Thresholds
router.get('/alert-thresholds', authenticate, authorize(UserRole.MANAGER), getAlertThresholds);
router.post('/alert-thresholds', authenticate, authorize(UserRole.MANAGER), createAlertThreshold);
router.put('/alert-thresholds/:id', authenticate, authorize(UserRole.MANAGER), updateAlertThreshold);

// Report Templates
router.get('/report-templates', authenticate, authorize(UserRole.MANAGER), getReportTemplates);
router.post('/report-templates', authenticate, authorize(UserRole.MANAGER), createReportTemplate);
router.put('/report-templates/:id', authenticate, authorize(UserRole.MANAGER), updateReportTemplate);

// Environments & Teams
router.get('/environments', authenticate, getEnvironments);
router.get('/teams', authenticate, getTeams);

export default router;
