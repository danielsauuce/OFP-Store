import express from 'express';
import { uploadImage, uploadMultipleImages, getAllMedia } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';
import rateLimiterMiddleware from '../middleware/rateLimiter.js';

const router = express.Router();

// All upload routes require authentication and admin role
router.use(authenticate, isAdmin);

// Get all uploaded media (admin view)
router.get('/all', getAllMedia);

// Upload single image
router.post('/single', rateLimiterMiddleware, uploadSingle('image'), uploadImage);

// Upload multiple images
router.post(
  '/multiple',
  rateLimiterMiddleware,
  uploadMultiple('images', 10), // max 10 files
  uploadMultipleImages,
);

export default router;
