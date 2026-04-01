import ChatMessage from '../models/chatMessage.js';
import logger from '../utils/logger.js';
import { activeSocketConnections } from '../config/prometheus.js';

export function setupChatHandler(io) {
  const nsp = io.of('/chat');

  nsp.on('connection', (socket) => {
    const userId = socket.data.userId;
    const userRole = socket.data.role;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    if (userRole === 'admin') {
      socket.join('chat:admin');
    } else {
      socket.join(`chat:user:${userId}`);
    }

    activeSocketConnections.inc({ namespace: 'chat' });
    logger.info('User connected to chat namespace', { userId, role: userRole });

    socket.on('chat:join-conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`chat:conv:${conversationId}`);
      }
    });

    socket.on('chat:send', async ({ conversationId, message }) => {
      if (!conversationId || !message?.trim()) return;

      try {
        const chatMessage = await ChatMessage.create({
          conversationId,
          sender: {
            userId,
            role: userRole === 'admin' ? 'admin' : 'customer',
          },
          message: message.trim(),
          readBy: [userId],
        });

        const populated = await chatMessage.populate('sender.userId', 'fullName email');

        nsp.to(`chat:conv:${conversationId}`).emit('chat:message', populated);

        // Also notify the user room if admin is replying
        if (userRole === 'admin') {
          const customerId = conversationId.replace('conv:', '');
          nsp.to(`chat:user:${customerId}`).emit('chat:message', populated);
        } else {
          nsp.to('chat:admin').emit('chat:message', populated);
        }
      } catch (error) {
        logger.error('Chat send error', { error: error.message });
      }
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`chat:conv:${conversationId}`).emit('chat:typing', {
        userId,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      activeSocketConnections.dec({ namespace: 'chat' });
      logger.info('User disconnected from chat namespace', { userId });
    });
  });

  return nsp;
}
