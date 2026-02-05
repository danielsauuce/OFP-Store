import express from 'express';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  addReply,
  // Admin endpoints
  getAllTicketsAdmin,
  getTicketAdmin,
  updateTicketAdmin,
  addAdminReply,
} from '../controllers/supportController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// ─── Public / Authenticated user routes
router.post('/', createTicket); // allows both logged-in and guests

router.use(authenticate);

router.get('/my-tickets', getMyTickets);
router.get('/:id', getTicketById);
router.post('/:id/reply', addReply);

// Admin Support Management
router.get('/admin', authenticate, isAdmin, getAllTicketsAdmin);
router.get('/admin/:id', authenticate, isAdmin, getTicketAdmin);
router.patch('/admin/:id', authenticate, isAdmin, updateTicketAdmin);
router.post('/admin/:id/reply', authenticate, isAdmin, addAdminReply);

export default router;
