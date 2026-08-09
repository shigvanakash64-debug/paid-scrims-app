import express from 'express';
import {
  listWallpapers,
  getWallpaperById,
  createWallpaper,
  updateWallpaper,
  deleteWallpaper,
  purchaseWallpaper,
  getMyLibrary,
} from '../controllers/wallpaperController.js';
import {
  createWallpaperPaymentOrder,
  verifyWallpaperPaymentReturn,
  handleWallpaperWebhook,
} from '../controllers/wallpaperPaymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/me/library', authMiddleware, getMyLibrary);
router.get('/payment/return', verifyWallpaperPaymentReturn);
router.post('/payment/create-order', authMiddleware, createWallpaperPaymentOrder);
router.post('/payment/webhook', express.raw({ type: '*/*' }), handleWallpaperWebhook);
router.get('/', listWallpapers);
router.get('/:id', getWallpaperById);
router.post('/', authMiddleware, upload.single('file'), createWallpaper);
router.put('/:id', authMiddleware, updateWallpaper);
router.delete('/:id', authMiddleware, deleteWallpaper);
router.post('/:id/purchase', authMiddleware, purchaseWallpaper);

export default router;
