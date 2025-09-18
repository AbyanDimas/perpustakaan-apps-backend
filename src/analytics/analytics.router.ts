import { Router } from 'express';
import { analyticsController } from './analytics.controller';

const router = Router();

router.get('/', analyticsController);

export default router;
