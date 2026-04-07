import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getPaymentStats,
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

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Payments
router.get('/payments/stats', getPaymentStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/delete/:id', deleteUser);

// Product Management
router.get('/products', cacheMiddleware(3600), getAllProducts);
router.get('/products/:id', cacheMiddleware(3600), getProductById);
router.post('/products/create', createProduct);
router.put('/products/update/:id', updateProduct);
router.delete('/products/delete/:id', deleteProduct);

export default router;
