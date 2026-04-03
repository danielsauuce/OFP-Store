import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Package, MessageCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getNotificationsService,
  markAllAsReadService,
  markAsReadService,
} from '../../services/notificationService';
import { useNotifications } from '../../context/notificationContext';

const TYPE_ICON = {
  chat_message: MessageCircle,
  order_placed: Package,
  order_status_updated: Package,
  order_cancelled: Package,
};

function AdminNotifications() {
  const navigate = useNavigate();
  const { refreshCount } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNotifications = useCallback(async (page = 1, append = false) => {
    try {
      const data = await getNotificationsService(page, 15);
      if (data?.success) {
        setNotifications((prev) =>
          append ? [...prev, ...data.notifications] : data.notifications,
        );
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadService();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshCount();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsReadService(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)),
        );
        refreshCount();
      } catch {
        // Non-critical
      }
    }

    if (notification.type === 'chat_message') {
      navigate('/admin/chat');
      return;
    }

    if (
      notification.type === 'order_placed' ||
      notification.type === 'order_status_updated' ||
      notification.type === 'order_cancelled'
    ) {
      navigate('/admin/orders');
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || pagination.page >= pagination.pages) return;
    setLoadingMore(true);
    await loadNotifications(pagination.page + 1, true);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination.total} total{unread > 0 && ` · ${unread} unread`}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-16 text-center">
          <Bell className="h-14 w-14 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="font-medium text-foreground mb-1">All caught up</p>
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = TYPE_ICON[notification.type] || Package;
            return (
              <button
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
                  !notification.isRead
                    ? 'bg-primary/5 border-primary/20 hover:bg-primary/8'
                    : 'bg-card border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-full p-2 shrink-0 ${
                      !notification.isRead ? 'bg-primary/15' : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p
                        className={`text-sm font-semibold ${
                          !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {pagination.page < pagination.pages && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminNotifications;
