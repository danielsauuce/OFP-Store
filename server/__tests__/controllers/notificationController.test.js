// module mocks
jest.mock('../../models/notification.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../../controllers/notificationController.js';

import Notification from '../../models/notification.js';

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
  user: { id: 'user1' },
  ...overrides,
});

// getNotifications
describe('getNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with paginated notification list', async () => {
    const fakeNotifications = [{ _id: 'n1', message: 'Your order has shipped' }];
    Notification.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeNotifications),
          }),
        }),
      }),
    });
    Notification.countDocuments.mockResolvedValue(1);

    const req = mockReq({ query: { page: '1', limit: '10' } });
    const res = mockRes();

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.notifications).toEqual(fakeNotifications);
    expect(body.pagination.total).toBe(1);
  });

  test('uses default page and limit when query params missing', async () => {
    Notification.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    Notification.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });

  test('returns 500 on database error', async () => {
    Notification.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    });
    Notification.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getNotifications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// getUnreadCount
describe('getUnreadCount', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with unread count', async () => {
    Notification.countDocuments.mockResolvedValue(5);

    const req = mockReq();
    const res = mockRes();

    await getUnreadCount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.count).toBe(5);
  });

  test('returns 200 with count 0 when no unread notifications', async () => {
    Notification.countDocuments.mockResolvedValue(0);

    const req = mockReq();
    const res = mockRes();

    await getUnreadCount(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].count).toBe(0);
  });

  test('returns 500 on database error', async () => {
    Notification.countDocuments.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await getUnreadCount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// markAsRead
describe('markAsRead', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with updated notification', async () => {
    const fakeNotification = { _id: 'n1', isRead: true };
    Notification.findOneAndUpdate.mockResolvedValue(fakeNotification);

    const req = mockReq({ params: { id: 'n1' } });
    const res = mockRes();

    await markAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.notification).toEqual(fakeNotification);
  });

  test('returns 404 when notification not found', async () => {
    Notification.findOneAndUpdate.mockResolvedValue(null);

    const req = mockReq({ params: { id: 'nonexistent' } });
    const res = mockRes();

    await markAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Notification not found' }),
    );
  });

  test('returns 500 on database error', async () => {
    Notification.findOneAndUpdate.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ params: { id: 'n1' } });
    const res = mockRes();

    await markAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// markAllAsRead
describe('markAllAsRead', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 and marks all notifications as read', async () => {
    Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const req = mockReq();
    const res = mockRes();

    await markAllAsRead(req, res);

    expect(Notification.updateMany).toHaveBeenCalledWith(
      { user: 'user1', isRead: false },
      { isRead: true },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
  });

  test('returns 500 on database error', async () => {
    Notification.updateMany.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await markAllAsRead(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
