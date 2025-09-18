import { Router } from 'express';
import { genresController } from './genres.controller';

const router = Router();

router.get('/', genresController);

export default router;
