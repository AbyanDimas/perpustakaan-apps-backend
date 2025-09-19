import { Router } from 'express';
import { languagesController } from '@/languages/languages.controller';

const router = Router();

router.get('/', languagesController);

export default router;
