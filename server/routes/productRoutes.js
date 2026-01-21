import express from 'express';
import { createProduct } from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware(3600), getAllProducts);
router.get('/:id', cacheMiddleware(3600), getProductById);

// Admin only routes
router.post('/', authenticate, isAdmin, createProduct);
router.put('/:id', authenticate, isAdmin, updateProduct);
router.delete('/:id', authenticate, isAdmin, deleteProduct);

export default router;
