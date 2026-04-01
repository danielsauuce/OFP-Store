import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { setupNotificationHandler } from './notificationHandler.js';
import { setupChatHandler } from './chatHandler.js';

let io = null;

export function initSocket(httpServer, corsOptions) {
  if (io) return io;

  io = new Server(httpServer, { cors: corsOptions });

  // JWT auth middleware — applies to all namespaces
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = payload.userId;
      socket.data.username = payload.username;
      socket.data.role = payload.role;
      next();
    } catch (error) {
      logger.warn('Socket authentication failed', { error: error.message });
      next(new Error('Authentication failed'));
    }
  });

  setupNotificationHandler(io);
  setupChatHandler(io);

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO() {
  return io;
}
