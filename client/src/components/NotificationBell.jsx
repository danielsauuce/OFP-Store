import { useNavigate } from 'react-router-dom';
import { BellRing } from 'lucide-react';
import { useNotifications } from '../context/notificationContext';

function NotificationBell() {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

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
