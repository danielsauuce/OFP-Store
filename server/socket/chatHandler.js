import ChatMessage from '../models/chatMessage.js';
import Conversation from '../models/conversation.js';
import Notification from '../models/notification.js';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { activeSocketConnections } from '../config/prometheus.js';
import { emitNotification } from './notificationHandler.js';

const GUEST_ID_RE = /^[a-zA-Z0-9_-]{16,64}$/;

export function setupChatHandler(io) {
  const nsp = io.of('/chat');

  // Per-namespace auth: accept JWT token OR validated guestId
  nsp.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const guestId = socket.handshake.auth?.guestId;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.userId = payload.userId;
        socket.data.username = payload.username;
        socket.data.role = payload.role;
        return next();
      } catch {
        return next(new Error('Authentication failed'));
      }
    }

    if (guestId && GUEST_ID_RE.test(guestId)) {
      socket.data.guestId = guestId;
      socket.data.role = 'guest';
      return next();
    }

    return next(new Error('Authentication required'));
  });

  nsp.on('connection', (socket) => {
    const userId = socket.data.userId;
    const guestId = socket.data.guestId;
    const userRole = socket.data.role;

    if (userRole === 'admin') {
      socket.join('chat:admin');
    } else if (userRole === 'guest') {
      socket.join(`chat:guest:${guestId}`);
    } else if (userId) {
      socket.join(`chat:user:${userId}`);
    } else {
      socket.disconnect(true);
      return;
    }

    activeSocketConnections.inc({ namespace: 'chat' });
    logger.info('User connected to chat namespace', { userId, guestId, role: userRole });

    // Initialize / resume a conversation via socket (works for both auth + guest)
    socket.on('chat:init', async ({ forceNew = false } = {}) => {
      try {
        let conversationId;

        if (userRole === 'guest') {
          if (forceNew) {
            conversationId = `conv:guest:${guestId}:${Date.now()}`;
          } else {
            // Find most recent open guest conversation
            const existing = await Conversation.findOne({ guestId })
              .sort({ createdAt: -1 })
              .lean();
            conversationId =
              existing && existing.status !== 'closed'
                ? existing.conversationId
                : `conv:guest:${guestId}:${Date.now()}`;
          }
        } else {
          if (forceNew) {
            conversationId = `conv:${userId}:${Date.now()}`;
          } else {
            const existing = await Conversation.findOne({ userId })
              .sort({ createdAt: -1 })
              .lean();
            conversationId =
              existing && existing.status !== 'closed'
                ? existing.conversationId
                : `conv:${userId}`;
          }
        }

        const conv = await Conversation.findOneAndUpdate(
          { conversationId },
          {
            $setOnInsert: {
              conversationId,
              ...(userId ? { userId } : {}),
              ...(guestId ? { guestId } : {}),
              status: 'pending',
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        const messages = await ChatMessage.find({ conversationId })
          .populate('sender.userId', 'fullName email profilePicture')
          .sort({ createdAt: 1 })
          .limit(50)
          .lean();

        socket.join(`chat:conv:${conversationId}`);
        socket.emit('chat:initialized', {
          conversationId,
          status: conv.status || 'pending',
          messages,
        });
      } catch (err) {
        logger.error('chat:init error', { error: err.message });
        socket.emit('chat:error', { message: 'Failed to initialize chat' });
      }
    });

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
          const conv = await Conversation.findOne({ conversationId }).lean();
          if (conv?.userId) {
            nsp.to(`chat:user:${conv.userId}`).emit('chat:admin-joined', { conversationId });
          }
          if (conv?.guestId) {
            nsp.to(`chat:guest:${conv.guestId}`).emit('chat:admin-joined', { conversationId });
          }

          await ChatMessage.updateMany(
            { conversationId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } },
          );
        } catch (err) {
          logger.error('Admin join-conversation error', { error: err.message });
        }
      }
    });

    socket.on('chat:send', async ({ conversationId, message, tempId }) => {
      if (!conversationId || !message?.trim()) return;

      try {
        const senderDoc = {
          role: userRole === 'admin' ? 'admin' : userRole === 'guest' ? 'guest' : 'customer',
          ...(userId ? { userId } : {}),
          ...(userRole === 'guest' ? { senderName: 'Guest' } : {}),
        };

        const chatMessage = await ChatMessage.create({
          conversationId,
          sender: senderDoc,
          message: message.trim(),
          readBy: userId ? [userId] : [],
        });

        const populated = await chatMessage.populate('sender.userId', 'fullName email profilePicture');

        // Emit to conversation room
        nsp.to(`chat:conv:${conversationId}`).emit('chat:message', {
          ...populated.toObject(),
          tempId,
        });

        if (userRole === 'admin') {
          // Also push to customer's personal room
          const conv = await Conversation.findOneAndUpdate(
            { conversationId },
            { lastMessage: message.trim(), lastMessageAt: new Date() },
          ).lean();

          if (conv?.userId) {
            nsp.to(`chat:user:${conv.userId}`).emit('chat:message', {
              ...populated.toObject(),
              tempId,
            });
            // Notify the user so their bell badge updates
            try {
              const notification = await Notification.create({
                user: conv.userId,
                type: 'chat_message',
                title: 'New message from Support',
                message: `${message.trim().substring(0, 80)}${message.trim().length > 80 ? '…' : ''}`,
                metadata: { conversationId },
              });
              emitNotification(conv.userId.toString(), notification);
            } catch (notifErr) {
              logger.warn('Failed to create user chat notification', { error: notifErr.message });
            }
          }
          if (conv?.guestId) {
            nsp.to(`chat:guest:${conv.guestId}`).emit('chat:message', {
              ...populated.toObject(),
              tempId,
            });
          }
        } else {
          // Customer or guest message — alert all admins
          nsp.to('chat:admin').emit('chat:new-message', {
            conversationId,
            message: { ...populated.toObject(), tempId },
          });

          const conv = await Conversation.findOneAndUpdate(
            { conversationId },
            {
              lastMessage: message.trim(),
              lastMessageAt: new Date(),
              $inc: { unreadByAdmin: 1 },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );

          if (!conv.userId && userId) {
            await Conversation.findOneAndUpdate({ conversationId }, { userId });
          }

          // Notify admins
          const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
          await Promise.all(
            admins.map(async (admin) => {
              const notification = await Notification.create({
                user: admin._id,
                type: 'chat_message',
                title: 'New Support Message',
                message: `${message.trim().substring(0, 80)}${message.trim().length > 80 ? '…' : ''}`,
                metadata: { conversationId, customerId: userId || guestId },
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
      socket.to(`chat:conv:${conversationId}`).emit('chat:typing', {
        userId: userId || guestId,
        isTyping,
      });
    });

    socket.on('chat:close', async ({ conversationId }) => {
      if (userRole !== 'admin') return;
      try {
        await Conversation.findOneAndUpdate({ conversationId }, { status: 'closed' });
        nsp.to(`chat:conv:${conversationId}`).emit('chat:closed', { conversationId });

        const conv = await Conversation.findOne({ conversationId }).lean();
        if (conv?.userId) {
          nsp.to(`chat:user:${conv.userId}`).emit('chat:closed', { conversationId });
        }
        if (conv?.guestId) {
          nsp.to(`chat:guest:${conv.guestId}`).emit('chat:closed', { conversationId });
        }

        logger.info('Conversation closed by admin', { conversationId, adminId: userId });
      } catch (err) {
        logger.error('Chat close error', { error: err.message });
      }
    });

    socket.on('disconnect', () => {
      activeSocketConnections.dec({ namespace: 'chat' });
      logger.info('User disconnected from chat namespace', { userId, guestId });
    });
  });

  return nsp;
}
