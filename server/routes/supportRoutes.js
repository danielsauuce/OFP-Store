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

// Public
router.post('/', createTicket);

router.use(authenticate);

router.get('/admin', isAdmin, getAllTicketsAdmin);
router.get('/admin/:id', isAdmin, getTicketAdmin);
router.patch('/admin/:id', isAdmin, updateTicketAdmin);
router.post('/admin/:id/reply', isAdmin, addAdminReply);

// User ticket routes
router.get('/my-tickets', getMyTickets);
router.get('/:id', getTicketById);
router.post('/:id/reply', addReply);

export default router;
