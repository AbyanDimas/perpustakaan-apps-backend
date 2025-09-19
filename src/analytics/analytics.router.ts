import { Router } from 'express';
import { analyticsController } from '@/analytics/analytics.controller';

const router = Router();

router.get('/', analyticsController);

export default router;
