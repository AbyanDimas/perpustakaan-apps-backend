import { Router } from 'express';
import { getBooksController, createBookController, updateBookController, deleteBookController } from './books.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', getBooksController);
router.post('/', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), createBookController);
router.put('/:id', upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateBookController);
router.delete('/:id', deleteBookController);

export default router;
