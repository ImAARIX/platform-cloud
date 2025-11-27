import { Router } from 'express';
import { createImage, uploadImage, getMyImages, getImageById, upload } from '../controllers/imageController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All image routes require authentication
router.post('/create', authMiddleware, createImage);
router.post('/:id/upload', authMiddleware, upload.single('file'), uploadImage);
router.get('/me', authMiddleware, getMyImages);
router.get('/:id', authMiddleware, getImageById);

export default router;
