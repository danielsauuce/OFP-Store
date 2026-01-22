import express from 'express';
import { uploadImage, uploadMultipleImages, deleteImage } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// only admin user can do all of this
router.post('/single', authenticate, isAdmin, uploadSingle('image'), uploadImage);

router.post('/multiple', authenticate, isAdmin, uploadMultiple('images', 5), uploadMultipleImages);

router.delete('/delete', authenticate, isAdmin, deleteImage);

export default router;
