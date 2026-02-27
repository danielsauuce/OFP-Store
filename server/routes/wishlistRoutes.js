import express from 'express';
import {
  getWishlist,
  addProductToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../controllers/wishlistController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getWishlist);
router.post('/', addProductToWishlist);
router.delete('/:productId', removeFromWishlist);
router.delete('/', clearWishlist);

export default router;
