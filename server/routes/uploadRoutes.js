import express from 'express';
import { uploadImage, uploadMultipleImages, getAllMedia } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';
import rateLimiterMiddleware from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/all', authenticate, isAdmin, getAllMedia);

// Admin Upload Management
router.post(
  '/single',
  authenticate,
  isAdmin,
  rateLimiterMiddleware,
  uploadSingle('image'),
  uploadImage,
);

router.post(
  '/multiple',
  authenticate,
  isAdmin,
  rateLimiterMiddleware,
  uploadMultiple('images', 5),
  uploadMultipleImages,
);

// delete route would be implemented only if later admin is allowed to delte media outside the product
// router.delete('/delete/:folder/:id', authenticate, isAdmin, deleteImage);

export default router;
