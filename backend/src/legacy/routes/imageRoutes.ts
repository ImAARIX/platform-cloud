import { Router } from 'express';
import { createImage, uploadImage, getMyImages, getImageById, deleteImage, upload, azureBlobUpload } from '../controllers/imageController';
import { authMiddleware } from '../middleware/auth';
import 'dotenv/config';

const router = Router();

// Determine which upload middleware to use based on environment
const useAzureStorage = !!(process.env.AZURE_STORAGE_CONNECTION_STRING || process.env.AZURE_KEY_VAULT_URL);
const uploadMiddleware = useAzureStorage ? azureBlobUpload.single('file') : upload.single('file');

// All image routes require authentication
router.post('/create', authMiddleware, createImage);
router.post('/:id/upload', authMiddleware, uploadMiddleware, uploadImage);
router.get('/me', authMiddleware, getMyImages);
router.get('/:id', authMiddleware, getImageById);
router.delete('/:id', authMiddleware, deleteImage);

export default router;
