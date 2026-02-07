import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  // Admin endpoints
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

router.use(authenticate);

// Admin routes
router.get('/admin', isAdmin, getAllOrdersAdmin);
router.patch('/admin/:id/status', isAdmin, updateOrderStatusAdmin);

// User routes
router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

export default router;
