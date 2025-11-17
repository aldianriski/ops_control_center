import { Router } from 'express';
import { getTimelineEvents, createTimelineEvent } from '../controllers/timeline.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getTimelineEvents);
router.post('/', authenticate, createTimelineEvent);

export default router;
