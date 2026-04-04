import ChatMessage from '../models/chatMessage.js';
import Conversation from '../models/conversation.js';
import logger from '../utils/logger.js';

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .populate({
        path: 'userId',
        select: 'fullName email profilePicture',
        populate: { path: 'profilePicture', select: 'secureUrl publicId url' },
      })
      .populate('adminId', 'fullName')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    // Normalise: for guest conversations without a userId, expose a display name
    const normalised = conversations.map((c) => ({
      ...c,
      displayName: c.userId?.fullName || c.userId?.email || c.guestName || 'Guest',
    }));

    res.status(200).json({ success: true, conversations: normalised });
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
        .populate({
          path: 'sender.userId',
          select: 'fullName email profilePicture',
          populate: { path: 'profilePicture', select: 'secureUrl publicId url' },
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatMessage.countDocuments({ conversationId }),
    ]);

    // Mark as read by admin
    await Promise.all([
      ChatMessage.updateMany(
        { conversationId, readBy: { $ne: req.user.id } },
        { $addToSet: { readBy: req.user.id } },
      ),
      Conversation.findOneAndUpdate({ conversationId }, { unreadByAdmin: 0 }),
    ]);

    res.status(200).json({
      success: true,
      messages,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
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

    // Ensure Conversation document exists
    await Conversation.findOneAndUpdate(
      { conversationId },
      { $setOnInsert: { conversationId, userId, status: 'pending' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const messages = await ChatMessage.find({ conversationId })
      .populate({
        path: 'sender.userId',
        select: 'fullName email profilePicture',
        populate: { path: 'profilePicture', select: 'secureUrl publicId url' },
      })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    const conversation = await Conversation.findOne({ conversationId }).lean();

    res.status(200).json({
      success: true,
      conversationId,
      status: conversation?.status || 'pending',
      messages,
    });
  } catch (error) {
    logger.error('Create conversation error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
};

export const closeConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Conversation.findOneAndUpdate({ conversationId }, { status: 'closed' });
    res.status(200).json({ success: true, message: 'Conversation closed' });
  } catch (error) {
    logger.error('Close conversation error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to close conversation' });
  }
};
