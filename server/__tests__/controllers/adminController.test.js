npm ijest.mock('../../models/user.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../models/order.js', () => ({
  default: { find: jest.fn(), countDocuments: jest.fn() },
  __esModule: true,
}));

jest.mock('../../models/product.js', () => ({
  default: { countDocuments: jest.fn() },
  __esModule: true,
}));

jest.mock('../../models/media.js', () => ({
  default: { findByIdAndDelete: jest.fn() },
  __esModule: true,
}));

jest.mock('../../config/cloudinary.js', () => ({
  deleteMediaFromCloudinary: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getDashboardStats,
} from '../../controllers/adminController.js';

import User from '../../models/user.js';
import Order from '../../models/order.js';
import Product from '../../models/product.js';
import Media from '../../models/media.js';
const mockUser = User;
const mockOrder = Order;
const mockProduct = Product;
const mockMedia = Media;

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
  user: { id: 'admin1', role: 'admin' },
  ...overrides,
});

const validObjectId = 'a'.repeat(24);

// get all users
describe('getAllUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with users and pagination', async () => {
    const fakeUsers = [{ _id: 'u1', fullName: 'Dan' }];
    mockUser.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(fakeUsers),
              }),
            }),
          }),
        }),
      }),
    });
    mockUser.countDocuments.mockResolvedValue(1);

    const req = mockReq({ query: { page: '1', limit: '20' } });
    const res = mockRes();

    await getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        users: fakeUsers,
        pagination: expect.objectContaining({ total: 1 }),
      }),
    );
  });

  test('returns 500 on error', async () => {
    mockUser.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockRejectedValue(new Error('DB error')),
              }),
            }),
          }),
        }),
      }),
    });

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getAllUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// getUserById
describe('getUserById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid id', async () => {
    const req = mockReq({ params: { id: 'bad-id' } });
    const res = mockRes();

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when user not found', async () => {
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with user data', async () => {
    const fakeUser = { _id: validObjectId, fullName: 'Daniel' };
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUser),
      }),
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, user: fakeUser }),
    );
  });
});

// updateUserStatus
describe('updateUserStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid id', async () => {
    const req = mockReq({ params: { id: 'bad-id' }, body: { isActive: false } });
    const res = mockRes();

    await updateUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 for invalid body', async () => {
    const req = mockReq({
      params: { id: validObjectId },
      body: { isActive: 'maybe' },
    });
    const res = mockRes();

    await updateUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 403 when trying to change own status', async () => {
    const selfId = 'b'.repeat(24); // valid ObjectId format
    const req = mockReq({
      params: { id: selfId },
      body: { isActive: false },
      user: { id: selfId },
    });
    const res = mockRes();

    await updateUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'You cannot change your own status' }),
    );
  });

  test('returns 404 when user not found', async () => {
    mockUser.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq({
      params: { id: validObjectId },
      body: { isActive: false },
    });
    const res = mockRes();

    await updateUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful status update', async () => {
    const updatedUser = { _id: validObjectId, isActive: false };
    mockUser.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const req = mockReq({
      params: { id: validObjectId },
      body: { isActive: false },
    });
    const res = mockRes();

    await updateUserStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('deactivated') }),
    );
  });
});

// updateUserRole
describe('updateUserRole', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 403 when trying to change own role', async () => {
    const selfId = 'b'.repeat(24);
    const req = mockReq({
      params: { id: selfId },
      body: { role: 'user' },
      user: { id: selfId },
    });
    const res = mockRes();

    await updateUserRole(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'You cannot change your own role' }),
    );
  });

  test('returns 400 for invalid role', async () => {
    const req = mockReq({
      params: { id: validObjectId },
      body: { role: 'superadmin' },
    });
    const res = mockRes();

    await updateUserRole(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 200 on successful role update', async () => {
    const updatedUser = { _id: validObjectId, role: 'admin' };
    mockUser.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(updatedUser),
    });

    const req = mockReq({
      params: { id: validObjectId },
      body: { role: 'admin' },
    });
    const res = mockRes();

    await updateUserRole(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User role updated successfully' }),
    );
  });
});

// deleteUser
describe('deleteUser', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 403 when trying to delete self', async () => {
    const selfId = 'b'.repeat(24);
    const req = mockReq({
      params: { id: selfId },
      user: { id: selfId },
    });
    const res = mockRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'You cannot delete your own account' }),
    );
  });

  test('returns 404 when user not found', async () => {
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful deletion', async () => {
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: validObjectId,
        profilePicture: null,
      }),
    });
    mockUser.findByIdAndDelete.mockResolvedValue(true);

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await deleteUser(req, res);

    expect(mockUser.findByIdAndDelete).toHaveBeenCalledWith(validObjectId);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User deleted successfully' }),
    );
  });
});

// getDashboardStats
describe('getDashboardStats', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with all stats', async () => {
    mockUser.countDocuments.mockResolvedValue(50);
    mockOrder.countDocuments.mockResolvedValue(120);
    mockProduct.countDocuments.mockResolvedValue(35);
    mockOrder.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([{ orderNumber: 'ORD-001', total: 500 }]),
            }),
          }),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getDashboardStats(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.stats.totalUsers).toBe(50);
    expect(data.stats.totalOrders).toBe(120);
    expect(data.stats.totalProducts).toBe(35);
    expect(data.stats.recentOrders).toHaveLength(1);
  });

  test('returns 500 on error', async () => {
    mockUser.countDocuments.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await getDashboardStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
