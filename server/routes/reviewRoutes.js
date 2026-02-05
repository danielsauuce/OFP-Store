import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  approveReview,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', cacheMiddleware(1800), getProductReviews);

// Authenticated user routes
router.use(authenticate);

router.post('/', createReview);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

// Admin Review Management
router.get('/admin', authenticate, isAdmin, getAllReviewsAdmin);
router.patch('/admin/:reviewId/approve', authenticate, isAdmin, approveReview);

export default router;
