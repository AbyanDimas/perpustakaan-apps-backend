import { Router } from 'express';
import { sseController } from './sse.controller';

const router = Router();

router.get('/stream', sseController);

export default router;
