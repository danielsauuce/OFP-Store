import Notification from '../models/notification.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { activeSocketConnections } from '../config/prometheus.js';

let notificationNamespace = null;

export function setupNotificationHandler(io) {
  const nsp = io.of('/notifications');
  notificationNamespace = nsp;

  // JWT middleware — io.use() only covers the default namespace in Socket.IO v4
  // Each custom namespace needs its own nsp.use() middleware
  nsp.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = payload.userId;
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

    socket.join(`user:${userId}`);
    if (userRole === 'admin') socket.join('admin:notifications');

    activeSocketConnections.inc({ namespace: 'notifications' });
    logger.info('User connected to notifications namespace', { userId });

    socket.on('notifications:mark-read', async ({ notificationId }) => {
      try {
        await Notification.findOneAndUpdate(
          { _id: notificationId, user: userId },
          { isRead: true },
        );
      } catch (error) {
        logger.error('Error marking notification read', { error: error.message });
      }
    });

    socket.on('disconnect', () => {
      activeSocketConnections.dec({ namespace: 'notifications' });
      logger.info('User disconnected from notifications namespace', { userId });
    });
  });

  return nsp;
}

export function emitNotification(userId, notification) {
  if (!notificationNamespace) return;
  notificationNamespace.to(`user:${userId}`).emit('notification:new', notification);
}
