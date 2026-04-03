import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './authContext';
import { getUnreadCountService } from '../services/notificationService';

const NotificationContext = createContext({
  unreadCount: 0,
  refreshCount: () => {},
  decrementCount: () => {},
  resetCount: () => {},
});

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export function NotificationProvider({ children }) {
  const { auth } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const refreshCount = useCallback(async () => {
    if (!auth.authenticate) return;
    try {
      const data = await getUnreadCountService();
      if (data?.success) setUnreadCount(data.count);
    } catch {
      // Silent — not critical
    }
  }, [auth.authenticate]);

  const decrementCount = useCallback((by = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - by));
  }, []);

  const resetCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!auth.authenticate) {
      setUnreadCount(0);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    refreshCount();

    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) return;

    const socket = io(`${BACKEND_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('notification:new', () => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [auth.authenticate, refreshCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshCount, decrementCount, resetCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
