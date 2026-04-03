import express from 'express';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import {
  getConversations,
  getMessages,
  createOrGetConversation,
  closeConversation,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversations', authenticate, isAdmin, getConversations);
router.get('/conversations/:conversationId/messages', authenticate, getMessages);
router.post('/conversations', authenticate, createOrGetConversation);
router.patch('/conversations/:conversationId/close', authenticate, isAdmin, closeConversation);

export default router;
