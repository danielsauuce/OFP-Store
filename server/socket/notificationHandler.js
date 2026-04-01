import Notification from '../models/notification.js';
import logger from '../utils/logger.js';
import { activeSocketConnections } from '../config/prometheus.js';

let notificationNamespace = null;

export function setupNotificationHandler(io) {
  const nsp = io.of('/notifications');
  notificationNamespace = nsp;

  nsp.on('connection', (socket) => {
    const userId = socket.data.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${userId}`);
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
