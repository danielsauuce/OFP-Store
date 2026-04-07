import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  approveReview,
  deleteReviewAdmin,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', cacheMiddleware(1800), getProductReviews);

// Authenticated user routes
router.use(authenticate);

router.get('/admin', isAdmin, getAllReviewsAdmin);
router.patch('/admin/:reviewId/visibility', isAdmin, approveReview);
router.delete('/admin/:reviewId', isAdmin, deleteReviewAdmin);

// User review CRUD
router.post('/', createReview);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

export default router;
