import express from 'express';
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getAllCategoriesAdmin,
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.get('/', cacheMiddleware(3600), getAllCategories);
router.get('/:slug', cacheMiddleware(1800), getCategoryBySlug);

// Admin routes
router.use(authenticate, isAdmin);
router.get('/admin/all', getAllCategoriesAdmin);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.patch('/:id/order', reorderCategories);

export default router;
