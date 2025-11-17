import { Router } from 'express';
import {
  getSOPExecutions,
  startSOPExecution,
  updateSOPExecution,
} from '../controllers/sopExecution.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSOPExecutions);
router.post('/', authenticate, startSOPExecution);
router.put('/:id', authenticate, updateSOPExecution);

export default router;
