import express from 'express';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from '../controllers/productController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware(3600), getAllProducts);
router.get('/:id', cacheMiddleware(3600), getProductById);

// Admin only routes
router.post('/create', authenticate, isAdmin, createProduct);
router.put('/update/:id', authenticate, isAdmin, updateProduct);
router.delete('/delete/:id', authenticate, isAdmin, deleteProduct);

export default router;
