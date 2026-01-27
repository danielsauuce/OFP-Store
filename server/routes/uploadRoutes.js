import express from 'express';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';
import rateLimiterMiddleware from '../middleware/rateLimiter.js';

const router = express.Router();

// only admin user can do all of this
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
