import express from 'express';
import {
  getAllUsers,
  getUsersById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// user management
router.get('/users', authenticate, isAdmin, getAllUsers);
router.get('/users/:id', authenticate, isAdmin, getUsersById);
router.patch('/users/:id/status', authenticate, isAdmin, updateUserStatus);
router.patch('/users/:id/role', authenticate, isAdmin, updateUserRole);
router.delete('/users/:id', authenticate, isAdmin, deleteUser);

export default router;
