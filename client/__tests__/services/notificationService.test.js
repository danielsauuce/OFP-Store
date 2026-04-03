import axiosInstance from '../../src/services/axiosInstance';
import {
  getNotificationsService,
  getUnreadCountService,
  markAsReadService,
  markAllAsReadService,
} from '../../src/services/notificationService';

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

// getNotificationsService tests
describe('getNotificationsService', () => {
  test('calls GET /api/notifications with default params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, notifications: [] } });

    await getNotificationsService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/notifications', {
      params: { page: 1, limit: 10 },
    });
  });

  test('passes custom page and limit params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, notifications: [] } });

    await getNotificationsService(2, 20);

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/notifications', {
      params: { page: 2, limit: 20 },
    });
  });

  test('returns notification data', async () => {
    const fakeData = {
      success: true,
      notifications: [{ _id: 'n1', message: 'Your order shipped' }],
      pagination: { total: 1 },
    };
    axiosInstance.get.mockResolvedValue({ data: fakeData });

    const result = await getNotificationsService();

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0]._id).toBe('n1');
  });

  test('propagates error on failure', async () => {
    axiosInstance.get.mockRejectedValue(new Error('Unauthorized'));

    await expect(getNotificationsService()).rejects.toThrow('Unauthorized');
  });
});

// getUnreadCountService tests
describe('getUnreadCountService', () => {
  test('calls GET /api/notifications/unread-count', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, count: 3 } });

    const result = await getUnreadCountService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/notifications/unread-count');
    expect(result.count).toBe(3);
  });

  test('returns count of 0 when no unread notifications', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, count: 0 } });

    const result = await getUnreadCountService();

    expect(result.count).toBe(0);
  });

  test('propagates error on failure', async () => {
    axiosInstance.get.mockRejectedValue(new Error('Network Error'));

    await expect(getUnreadCountService()).rejects.toThrow('Network Error');
  });
});

// markAsReadService tests
describe('markAsReadService', () => {
  test('calls PATCH /api/notifications/:id/read', async () => {
    axiosInstance.patch.mockResolvedValue({
      data: { success: true, notification: { _id: 'n1', isRead: true } },
    });

    const result = await markAsReadService('n1');

    expect(axiosInstance.patch).toHaveBeenCalledWith('/api/notifications/n1/read');
    expect(result.notification.isRead).toBe(true);
  });

  test('propagates error when notification not found', async () => {
    const error = { response: { status: 404, data: { message: 'Notification not found' } } };
    axiosInstance.patch.mockRejectedValue(error);

    await expect(markAsReadService('nonexistent')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});

// markAllAsReadService tests
describe('markAllAsReadService', () => {
  test('calls PATCH /api/notifications/read-all', async () => {
    axiosInstance.patch.mockResolvedValue({
      data: { success: true, message: 'All notifications marked as read' },
    });

    const result = await markAllAsReadService();

    expect(axiosInstance.patch).toHaveBeenCalledWith('/api/notifications/read-all');
    expect(result.success).toBe(true);
  });

  test('propagates error on failure', async () => {
    axiosInstance.patch.mockRejectedValue(new Error('Server Error'));

    await expect(markAllAsReadService()).rejects.toThrow('Server Error');
  });
});
