import express from 'express';
import { getAllProducts, getProductById } from '../controllers/productController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware(3600), getAllProducts);
router.get('/:id', cacheMiddleware(3600), getProductById);

export default router;
