import ChatMessage from '../models/chatMessage.js';
import Conversation from '../models/conversation.js';
import Notification from '../models/notification.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { activeSocketConnections } from '../config/prometheus.js';
import { emitNotification } from './notificationHandler.js';

export function setupChatHandler(io) {
  const nsp = io.of('/chat');

  // JWT middleware — io.use() only covers the default namespace in Socket.IO v4
  nsp.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = payload.userId;
      socket.data.username = payload.username;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

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

    // User joins their conversation room; admin explicitly joins to take it
    socket.on('chat:join-conversation', async ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`chat:conv:${conversationId}`);

      if (userRole === 'admin') {
        try {
          await Conversation.findOneAndUpdate(
            { conversationId },
            { status: 'active', adminId: userId, unreadByAdmin: 0 },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
          // Tell the customer admin has joined
          const customerId = conversationId.replace('conv:', '');
          nsp.to(`chat:user:${customerId}`).emit('chat:admin-joined', { conversationId });
          // Mark existing messages as read by this admin
          await ChatMessage.updateMany(
            { conversationId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } },
          );
        } catch (err) {
          logger.error('Admin join-conversation error', { error: err.message });
        }
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

        // Emit to conversation room (admin reads from here after joining)
        nsp.to(`chat:conv:${conversationId}`).emit('chat:message', populated);

        if (userRole === 'admin') {
          // Also push to customer's personal room so they receive it even before joining conv room
          const customerId = conversationId.replace('conv:', '');
          nsp.to(`chat:user:${customerId}`).emit('chat:message', populated);

          await Conversation.findOneAndUpdate(
            { conversationId },
            { lastMessage: message.trim(), lastMessageAt: new Date() },
          );
        } else {
          // Customer message — alert all admins
          nsp.to('chat:admin').emit('chat:new-message', { conversationId, message: populated });

          const conv = await Conversation.findOneAndUpdate(
            { conversationId },
            {
              lastMessage: message.trim(),
              lastMessageAt: new Date(),
              $inc: { unreadByAdmin: 1 },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );

          // Ensure userId is set on upsert
          if (!conv.userId) {
            await Conversation.findOneAndUpdate({ conversationId }, { userId });
          }

          // Create DB notifications for every active admin + push via socket
          const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
          await Promise.all(
            admins.map(async (admin) => {
              const notification = await Notification.create({
                user: admin._id,
                type: 'chat_message',
                title: 'New Support Message',
                message: `${message.trim().substring(0, 80)}${message.trim().length > 80 ? '…' : ''}`,
                metadata: { conversationId, customerId: userId },
              });
              emitNotification(admin._id.toString(), notification);
            }),
          );
        }
      } catch (error) {
        logger.error('Chat send error', { error: error.message });
        socket.emit('chat:error', { message: 'Failed to send message. Please try again.' });
      }
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(`chat:conv:${conversationId}`).emit('chat:typing', { userId, isTyping });
    });

    // Admin closes the conversation
    socket.on('chat:close', async ({ conversationId }) => {
      if (userRole !== 'admin') return;
      try {
        await Conversation.findOneAndUpdate({ conversationId }, { status: 'closed' });
        // Notify everyone in the conversation room
        nsp.to(`chat:conv:${conversationId}`).emit('chat:closed', { conversationId });
        // Also notify customer's user room
        const customerId = conversationId.replace('conv:', '');
        nsp.to(`chat:user:${customerId}`).emit('chat:closed', { conversationId });
        logger.info('Conversation closed by admin', { conversationId, adminId: userId });
      } catch (err) {
        logger.error('Chat close error', { error: err.message });
      }
    });

    socket.on('disconnect', () => {
      activeSocketConnections.dec({ namespace: 'chat' });
      logger.info('User disconnected from chat namespace', { userId });
    });
  });

  return nsp;
}
