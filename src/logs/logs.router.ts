import { Router } from 'express';
import { getLogsController, createLogController, deleteLogsController } from './logs.controller';

const router = Router();

router.get('/', getLogsController);
router.post('/', createLogController);
router.delete('/', deleteLogsController);

export default router;
