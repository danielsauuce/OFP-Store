import axiosInstance from '../../src/services/axiosInstance';
import {
  getConversationsService,
  getMessagesService,
  createConversationService,
} from '../../src/services/chatService';

jest.mock('../../src/services/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => jest.clearAllMocks());

// getConversationsService tests
describe('getConversationsService', () => {
  test('calls GET /api/chat/conversations', async () => {
    const fakeData = { success: true, conversations: [] };
    axiosInstance.get.mockResolvedValue({ data: fakeData });

    const result = await getConversationsService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/chat/conversations');
    expect(result.conversations).toEqual([]);
  });

  test('returns conversations list', async () => {
    const fakeData = {
      success: true,
      conversations: [{ _id: 'conv:user1', totalMessages: 5 }],
    };
    axiosInstance.get.mockResolvedValue({ data: fakeData });

    const result = await getConversationsService();

    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0]._id).toBe('conv:user1');
  });

  test('propagates error on failure', async () => {
    axiosInstance.get.mockRejectedValue(new Error('Forbidden'));

    await expect(getConversationsService()).rejects.toThrow('Forbidden');
  });
});

// getMessagesService tests
describe('getMessagesService', () => {
  test('calls GET /api/chat/conversations/:id/messages with default params', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { success: true, messages: [], pagination: { total: 0 } },
    });

    await getMessagesService('conv:user1');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/chat/conversations/conv%3Auser1/messages', {
      params: { page: 1, limit: 50 },
    });
  });

  test('passes custom page and limit params', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { success: true, messages: [] },
    });

    await getMessagesService('conv:user1', 2, 25);

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/chat/conversations/conv%3Auser1/messages', {
      params: { page: 2, limit: 25 },
    });
  });

  test('returns message data', async () => {
    const fakeMessages = [{ _id: 'msg1', content: 'Hello!' }];
    axiosInstance.get.mockResolvedValue({
      data: { success: true, messages: fakeMessages, pagination: { total: 1 } },
    });

    const result = await getMessagesService('conv:user1');

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe('Hello!');
  });

  test('propagates error on failure', async () => {
    axiosInstance.get.mockRejectedValue(new Error('Network Error'));

    await expect(getMessagesService('conv:user1')).rejects.toThrow('Network Error');
  });
});

// createConversationService tests
describe('createConversationService', () => {
  test('calls POST /api/chat/conversations', async () => {
    const fakeData = { success: true, conversationId: 'conv:user1', messages: [] };
    axiosInstance.post.mockResolvedValue({ data: fakeData });

    const result = await createConversationService();

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/chat/conversations');
    expect(result.conversationId).toBe('conv:user1');
  });

  test('returns existing messages when conversation exists', async () => {
    const fakeData = {
      success: true,
      conversationId: 'conv:user1',
      messages: [{ _id: 'msg1', content: 'Previous message' }],
    };
    axiosInstance.post.mockResolvedValue({ data: fakeData });

    const result = await createConversationService();

    expect(result.messages).toHaveLength(1);
  });

  test('propagates error on failure', async () => {
    axiosInstance.post.mockRejectedValue(new Error('Unauthorized'));

    await expect(createConversationService()).rejects.toThrow('Unauthorized');
  });
});
