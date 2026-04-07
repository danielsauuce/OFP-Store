// module mocks
jest.mock('../../models/chatMessage.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../models/conversation.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getConversations,
  getMessages,
  createOrGetConversation,
} from '../../controllers/chatController.js';

import ChatMessage from '../../models/chatMessage.js';
import Conversation from '../../models/conversation.js';

// helpers
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user1', role: 'admin' },
  ...overrides,
});

// Helper: builds a chainable mock for .populate().populate().sort().lean()
const makeConversationFindChain = (result) => ({
  populate: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(result),
      }),
    }),
  }),
});

// Helper: builds a chainable mock for ChatMessage.find with nested populate
const makeMessageFindChain = (result) => ({
  populate: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(result),
        }),
      }),
    }),
  }),
});

// Helper: ChatMessage.find chain for createOrGetConversation (no skip)
const makeMessageFindChainNoSkip = (result) => ({
  populate: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(result),
      }),
    }),
  }),
});

// getConversations (admin only)
describe('getConversations', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with conversation list', async () => {
    const fakeConversations = [
      { _id: 'conv1', userId: { fullName: 'Alice', email: 'a@b.com' }, lastMessageAt: new Date() },
    ];
    Conversation.find.mockReturnValue(makeConversationFindChain(fakeConversations));

    const req = mockReq();
    const res = mockRes();

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(Array.isArray(body.conversations)).toBe(true);
    expect(body.conversations[0].displayName).toBe('Alice');
  });

  test('returns 200 with empty conversations array when none exist', async () => {
    Conversation.find.mockReturnValue(makeConversationFindChain([]));

    const req = mockReq();
    const res = mockRes();

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].conversations).toEqual([]);
  });

  test('normalises displayName to email when fullName absent', async () => {
    const fakeConversations = [{ _id: 'conv2', userId: { email: 'guest@example.com' } }];
    Conversation.find.mockReturnValue(makeConversationFindChain(fakeConversations));

    const req = mockReq();
    const res = mockRes();

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].conversations[0].displayName).toBe('guest@example.com');
  });

  test('normalises displayName to "Guest" when no userId', async () => {
    const fakeConversations = [{ _id: 'conv3', guestName: null }];
    Conversation.find.mockReturnValue(makeConversationFindChain(fakeConversations));

    const req = mockReq();
    const res = mockRes();

    await getConversations(req, res);

    expect(res.json.mock.calls[0][0].conversations[0].displayName).toBe('Guest');
  });

  test('returns 500 on database error', async () => {
    Conversation.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// getMessages
describe('getMessages', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with paginated messages', async () => {
    const fakeMessages = [{ _id: 'msg1', content: 'Hello' }];
    ChatMessage.find.mockReturnValue(makeMessageFindChain(fakeMessages));
    ChatMessage.countDocuments.mockResolvedValue(1);
    ChatMessage.updateMany.mockResolvedValue({ modifiedCount: 1 });
    Conversation.findOneAndUpdate.mockResolvedValue({});

    const req = mockReq({ params: { conversationId: 'conv:user1' }, query: {} });
    const res = mockRes();

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.messages).toEqual(fakeMessages);
    expect(body.pagination.total).toBe(1);
  });

  test('marks messages as read for current user', async () => {
    ChatMessage.find.mockReturnValue(makeMessageFindChain([]));
    ChatMessage.countDocuments.mockResolvedValue(0);
    ChatMessage.updateMany.mockResolvedValue({ modifiedCount: 0 });
    Conversation.findOneAndUpdate.mockResolvedValue({});

    const req = mockReq({ params: { conversationId: 'conv:user1' }, query: {} });
    const res = mockRes();

    await getMessages(req, res);

    expect(ChatMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 'conv:user1' }),
      expect.objectContaining({ $addToSet: { readBy: 'user1' } }),
    );
  });

  test('returns 500 on database error', async () => {
    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockRejectedValue(new Error('DB error')),
            }),
          }),
        }),
      }),
    });
    ChatMessage.countDocuments.mockResolvedValue(0);

    const req = mockReq({ params: { conversationId: 'conv:user1' }, query: {} });
    const res = mockRes();

    await getMessages(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// createOrGetConversation
describe('createOrGetConversation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with conversationId and existing messages', async () => {
    const fakeMessages = [{ _id: 'msg1', content: 'Hi there' }];
    Conversation.findOneAndUpdate.mockResolvedValue({
      conversationId: 'conv:user1',
      status: 'open',
    });
    ChatMessage.find.mockReturnValue(makeMessageFindChainNoSkip(fakeMessages));
    Conversation.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ conversationId: 'conv:user1', status: 'open' }),
    });

    const req = mockReq({ user: { id: 'user1', role: 'customer' } });
    const res = mockRes();

    await createOrGetConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.conversationId).toBe('conv:user1');
    expect(body.messages).toEqual(fakeMessages);
    expect(body.status).toBe('open');
  });

  test('returns 200 with empty messages when no prior conversation', async () => {
    Conversation.findOneAndUpdate.mockResolvedValue({
      conversationId: 'conv:user2',
      status: 'pending',
    });
    ChatMessage.find.mockReturnValue(makeMessageFindChainNoSkip([]));
    Conversation.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ conversationId: 'conv:user2', status: 'pending' }),
    });

    const req = mockReq({ user: { id: 'user2', role: 'customer' } });
    const res = mockRes();

    await createOrGetConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].messages).toEqual([]);
    expect(res.json.mock.calls[0][0].status).toBe('pending');
  });

  test('defaults status to "pending" when no conversation document found', async () => {
    Conversation.findOneAndUpdate.mockResolvedValue(null);
    ChatMessage.find.mockReturnValue(makeMessageFindChainNoSkip([]));
    Conversation.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq({ user: { id: 'user3', role: 'customer' } });
    const res = mockRes();

    await createOrGetConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].status).toBe('pending');
  });

  test('returns 500 on database error', async () => {
    Conversation.findOneAndUpdate.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await createOrGetConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
