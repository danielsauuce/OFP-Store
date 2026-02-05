import express from 'express';
import {
  getAllUsers,
  getUsersById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getDashboardStats,
} from '../controllers/adminController.js';
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

router.use(authenticate, isAdmin);

// user management
router.get('/users', getAllUsers);
router.get('/users/:id', getUsersById);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/delete/:id', deleteUser);

// Product Management
router.get('/', cacheMiddleware(3600), getAllProducts);
router.get('/:id', cacheMiddleware(3600), getProductById);
router.post('/create', createProduct);
router.put('/update/:id', updateProduct);
router.delete('/delete/:id', deleteProduct);

// Dashboard Management
router.get('/dashboard/stats', getDashboardStats);

export default router;
