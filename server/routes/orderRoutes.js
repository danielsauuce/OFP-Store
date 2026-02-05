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

// user route
router.use(authenticate);

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

// admin route
router.get('/admin', authenticate, isAdmin, getAllOrdersAdmin);
router.patch('/admin/:id/status', authenticate, isAdmin, updateOrderStatusAdmin);

export default router;
