import express from 'express';
import { getAllProducts, getProductById } from '../controllers/productController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Public routes
router.get('/category/:slug', cacheMiddleware(1800), async (req, res) => {
  req.query.category = req.params.slug;
  return getAllProducts(req, res);
});

router.get('/', cacheMiddleware(1800), getAllProducts);
router.get('/:id', cacheMiddleware(1800), getProductById);

export default router;
