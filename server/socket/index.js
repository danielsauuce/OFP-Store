import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { setupNotificationHandler } from './notificationHandler.js';
import { setupChatHandler } from './chatHandler.js';

let io = null;

// Validate guestId: alphanumeric, hyphens, underscores — 16–64 chars
const GUEST_ID_RE = /^[a-zA-Z0-9_-]{16,64}$/;

export function initSocket(httpServer, corsOptions) {
  if (io) return io;

  io = new Server(httpServer, { cors: corsOptions });

  // Auth middleware — applies to the default namespace only.
  // Individual namespaces (chat, notifications) apply their own middleware.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const guestId = socket.handshake.auth?.guestId;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.userId = payload.userId;
        socket.data.username = payload.username;
        socket.data.role = payload.role;
        return next();
      } catch (error) {
        logger.warn('Socket authentication failed', { error: error.message });
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

  setupNotificationHandler(io);
  setupChatHandler(io);

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO() {
  return io;
}
