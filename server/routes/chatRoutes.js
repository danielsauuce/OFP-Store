import express from 'express';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { isAdmin } from '../middleware/adminAuth.js';
import {
  getConversations,
  getMessages,
  createOrGetConversation,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversations', authenticate, isAdmin, getConversations);
router.get('/conversations/:conversationId/messages', authenticate, getMessages);
router.post('/conversations', authenticate, createOrGetConversation);

export default router;
