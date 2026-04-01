import ChatMessage from '../models/chatMessage.js';
import logger from '../utils/logger.js';

export const getConversations = async (req, res) => {
  try {
    // Get distinct conversationIds with latest message and unread count
    const conversations = await ChatMessage.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          totalMessages: { $sum: 1 },
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
    ]);

    // Add unread counts for each conversation (messages not read by admin)
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await ChatMessage.countDocuments({
          conversationId: conv._id,
          'sender.role': 'customer',
          readBy: { $ne: req.user.id },
        });
        return { ...conv, unreadCount };
      }),
    );

    res.status(200).json({ success: true, conversations: result });
  } catch (error) {
    logger.error('Get conversations error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      ChatMessage.find({ conversationId })
        .populate('sender.userId', 'fullName email')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatMessage.countDocuments({ conversationId }),
    ]);

    // Mark messages as read by current user
    await ChatMessage.updateMany(
      { conversationId, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } },
    );

    res.status(200).json({
      success: true,
      messages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    logger.error('Get messages error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

export const createOrGetConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = `conv:${userId}`;

    const existingMessages = await ChatMessage.find({ conversationId })
      .populate('sender.userId', 'fullName email')
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      conversationId,
      messages: existingMessages,
    });
  } catch (error) {
    logger.error('Create conversation error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
};
