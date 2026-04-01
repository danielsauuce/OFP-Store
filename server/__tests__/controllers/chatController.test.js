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

// getConversations (admin only)
describe('getConversations', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with conversation list', async () => {
    const fakeConversations = [
      { _id: 'conv:user1', lastMessage: { content: 'Hello' }, totalMessages: 3 },
    ];
    ChatMessage.aggregate.mockResolvedValue(fakeConversations);
    ChatMessage.countDocuments.mockResolvedValue(1);

    const req = mockReq();
    const res = mockRes();

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(Array.isArray(body.conversations)).toBe(true);
  });

  test('returns 200 with empty conversations array when none exist', async () => {
    ChatMessage.aggregate.mockResolvedValue([]);

    const req = mockReq();
    const res = mockRes();

    await getConversations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].conversations).toEqual([]);
  });

  test('returns 500 on database error', async () => {
    ChatMessage.aggregate.mockRejectedValue(new Error('DB error'));

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
    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(fakeMessages),
            }),
          }),
        }),
      }),
    });
    ChatMessage.countDocuments.mockResolvedValue(1);
    ChatMessage.updateMany.mockResolvedValue({ modifiedCount: 1 });

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
    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });
    ChatMessage.countDocuments.mockResolvedValue(0);
    ChatMessage.updateMany.mockResolvedValue({ modifiedCount: 0 });

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
    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeMessages),
          }),
        }),
      }),
    });

    const req = mockReq({ user: { id: 'user1', role: 'customer' } });
    const res = mockRes();

    await createOrGetConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.conversationId).toBe('conv:user1');
    expect(body.messages).toEqual(fakeMessages);
  });

  test('returns 200 with empty messages when no prior conversation', async () => {
    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const req = mockReq({ user: { id: 'user2', role: 'customer' } });
    const res = mockRes();

    await createOrGetConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].messages).toEqual([]);
  });

  test('returns 500 on database error', async () => {
    ChatMessage.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await createOrGetConversation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
