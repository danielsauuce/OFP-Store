import express from 'express';
import {
  getAllUsers,
  getUsersById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
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

// user management
router.get('/users', authenticate, isAdmin, getAllUsers);
router.get('/users/:id', authenticate, isAdmin, getUsersById);
router.patch('/users/:id/status', authenticate, isAdmin, updateUserStatus);
router.patch('/users/:id/role', authenticate, isAdmin, updateUserRole);
router.delete('/users/delete/:id', authenticate, isAdmin, deleteUser);

// Product Management
router.get('/', cacheMiddleware(3600), getAllProducts);
router.get('/:id', cacheMiddleware(3600), getProductById);
router.post('/create', authenticate, isAdmin, createProduct);
router.put('/update/:id', authenticate, isAdmin, updateProduct);
router.delete('/delete/:id', authenticate, isAdmin, deleteProduct);

export default router;
