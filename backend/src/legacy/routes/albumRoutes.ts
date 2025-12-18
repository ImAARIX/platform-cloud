import {createAlbum, getMyAlbums, getAlbumById, updateAlbum, deleteAlbum} from '../controllers/albumController';
import {Router} from "express";
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, createAlbum);
router.get('/', authMiddleware, getMyAlbums);
router.get('/:id', authMiddleware, getAlbumById);
router.put('/:id', authMiddleware, updateAlbum);
router.delete('/:id', authMiddleware, deleteAlbum);

export default router;
