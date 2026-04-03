import Notification from '../models/notification.js';
import logger from '../utils/logger.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const parsedPage = parseInt(req.query.page, 10);
    const parsedLimit = parseInt(req.query.limit, 10);
    const page = Math.max(1, isNaN(parsedPage) ? 1 : parsedPage);
    const limit = Math.max(1, Math.min(50, isNaN(parsedLimit) ? 10 : parsedLimit));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ user: userId }),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    logger.error('Get notifications error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.status(200).json({ success: true, count });
  } catch (error) {
    logger.error('Get unread count error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    logger.error('Mark as read error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Mark all as read error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};
