import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { io } from 'socket.io-client';
import { getUnreadCountService } from '../services/notificationService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const data = await getUnreadCountService();
        if (mounted && data?.success) {
          setUnreadCount(data.count);
        }
      } catch {
        // Silently fail — not critical
      }
    };

    fetchCount();

    // Connect to /notifications namespace
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) return;

    const socket = io(`${BACKEND_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('notification:new', () => {
      if (mounted) setUnreadCount((prev) => prev + 1);
    });

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, []);

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="nav-action-icon relative hover:text-primary transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <BellRing size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2.5 bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
