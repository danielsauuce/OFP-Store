const mockUser = {
  findOne: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};
jest.mock('../../models/user.js', () => ({ default: mockUser, __esModule: true }));

const mockRefreshToken = { deleteMany: jest.fn(), create: jest.fn() };
jest.mock('../../models/refreshToken.js', () => ({ default: mockRefreshToken, __esModule: true }));

const mockGenerateTokens = jest.fn();
jest.mock('../../utils/generateToken.js', () => ({
  default: mockGenerateTokens,
  __esModule: true,
}));

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue(true),
  })),
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  registerUser,
  loginUser,
  changePassword,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from '../../controllers/authController.js';

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
  headers: {},
  user: null,
  ...overrides,
});

// register user
describe('registerUser', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body (missing email)', async () => {
    const req = mockReq({ body: { fullName: 'Dan', password: '12345678' } });
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Validation failed' }),
    );
  });

  test('returns 400 when email is already in use', async () => {
    mockUser.findOne.mockResolvedValue({ _id: 'existing123', email: 'dan@test.com' });

    const req = mockReq({
      body: { fullName: 'Daniel', email: 'dan@test.com', password: '12345678' },
    });
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Email already in use' }),
    );
  });

  test('returns 201 with tokens on successful registration', async () => {
    mockUser.findOne.mockResolvedValue(null);
    const fakeUser = {
      _id: 'user123',
      fullName: 'Daniel',
      email: 'dan@test.com',
      role: 'customer',
    };
    mockUser.create.mockResolvedValue(fakeUser);
    mockGenerateTokens.mockResolvedValue({
      accessToken: 'access-tok',
      refreshToken: 'refresh-tok',
    });

    const req = mockReq({
      body: { fullName: 'Daniel', email: 'dan@test.com', password: '12345678' },
    });
    const res = mockRes();

    await registerUser(req, res);

    expect(mockUser.create).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Daniel', email: 'dan@test.com' }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        accessToken: 'access-tok',
        refreshToken: 'refresh-tok',
      }),
    );
  });

  test('returns 500 when User.create throws', async () => {
    mockUser.findOne.mockResolvedValue(null);
    mockUser.create.mockRejectedValue(new Error('DB failure'));

    const req = mockReq({
      body: { fullName: 'Daniel', email: 'dan@test.com', password: '12345678' },
    });
    const res = mockRes();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to register user' }),
    );
  });
});

// login user
describe('loginUser', () => {
  beforeEach(() => jest.clearAllMocks());

  const chainedQuery = (userData) => ({
    select: jest.fn().mockResolvedValue(userData),
  });

  test('returns 400 for invalid body', async () => {
    const req = mockReq({ body: { email: 'invalid' } });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 401 when user not found', async () => {
    mockUser.findOne.mockReturnValue(chainedQuery(null));

    const req = mockReq({ body: { email: 'nope@test.com', password: 'password123' } });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid email or password' }),
    );
  });

  test('returns 403 when account is deactivated', async () => {
    const user = { isActive: false, comparePassword: jest.fn() };
    mockUser.findOne.mockReturnValue(chainedQuery(user));

    const req = mockReq({ body: { email: 'dan@test.com', password: 'password123' } });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Account is deactivated' }),
    );
  });

  test('returns 401 when password does not match', async () => {
    const user = {
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    mockUser.findOne.mockReturnValue(chainedQuery(user));

    const req = mockReq({ body: { email: 'dan@test.com', password: 'wrongpass1' } });
    const res = mockRes();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid email or password' }),
    );
  });

  test('returns 200 with tokens on successful login', async () => {
    const user = {
      _id: 'user1',
      fullName: 'Daniel',
      email: 'dan@test.com',
      role: 'customer',
      phone: '1234567890',
      isActive: true,
      lastLogin: null,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };
    mockUser.findOne.mockReturnValue(chainedQuery(user));
    mockGenerateTokens.mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const req = mockReq({ body: { email: 'dan@test.com', password: 'password123' } });
    const res = mockRes();

    await loginUser(req, res);

    expect(user.comparePassword).toHaveBeenCalledWith('password123');
    expect(user.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        accessToken: 'at',
        refreshToken: 'rt',
      }),
    );
  });
});

// changePassword
describe('changePassword', () => {
  beforeEach(() => jest.clearAllMocks());

  const chainedQuery = (userData) => ({
    select: jest.fn().mockResolvedValue(userData),
  });

  test('returns 400 for validation failure', async () => {
    const req = mockReq({
      body: { currentPassword: '12345678' }, // missing newPassword
      user: { id: 'user1' },
    });
    const res = mockRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when user not found', async () => {
    mockUser.findById.mockReturnValue(chainedQuery(null));

    const req = mockReq({
      body: { currentPassword: '12345678', newPassword: 'newpass12' },
      user: { id: 'user1' },
    });
    const res = mockRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 401 when current password is incorrect', async () => {
    const user = { comparePassword: jest.fn().mockResolvedValue(false) };
    mockUser.findById.mockReturnValue(chainedQuery(user));

    const req = mockReq({
      body: { currentPassword: 'wrongpass', newPassword: 'newpass12' },
      user: { id: 'user1' },
    });
    const res = mockRes();

    await changePassword(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Current password is incorrect' }),
    );
  });

  test('returns 200 and invalidates refresh tokens on success', async () => {
    const user = {
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
      password: null,
    };
    mockUser.findById.mockReturnValue(chainedQuery(user));
    mockRefreshToken.deleteMany.mockResolvedValue({});

    const req = mockReq({
      body: { currentPassword: '12345678', newPassword: 'newpass12' },
      user: { id: 'user1' },
    });
    const res = mockRes();

    await changePassword(req, res);

    expect(user.save).toHaveBeenCalled();
    expect(mockRefreshToken.deleteMany).toHaveBeenCalledWith({ user: 'user1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Password changed successfully' }),
    );
  });
});

// logout User
describe('logoutUser', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 and invalidates refresh tokens', async () => {
    mockRefreshToken.deleteMany.mockResolvedValue({});

    const req = mockReq({ user: { id: 'user1' } });
    const res = mockRes();

    await logoutUser(req, res);

    expect(mockRefreshToken.deleteMany).toHaveBeenCalledWith({ user: 'user1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Logged out successfully' }),
    );
  });

  test('returns 200 even when no user id present', async () => {
    const req = mockReq({ user: null });
    const res = mockRes();

    await logoutUser(req, res);

    expect(mockRefreshToken.deleteMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// get current user
describe('getCurrentUser', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with user data', async () => {
    const fakeUser = { _id: 'user1', fullName: 'Daniel', email: 'dan@test.com' };
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeUser),
        }),
      }),
    });

    const req = mockReq({ user: { id: 'user1' } });
    const res = mockRes();

    await getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, user: fakeUser }),
    );
  });

  test('returns 404 when user not found', async () => {
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    const req = mockReq({ user: { id: 'nonexistent' } });
    const res = mockRes();

    await getCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// forget password
describe('forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when email is missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Email is required' }),
    );
  });

  test('returns 200 with generic message even when user not found (security)', async () => {
    mockUser.findOne.mockResolvedValue(null);

    const req = mockReq({ body: { email: 'nope@test.com' } });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('returns 200 and sends email when user found', async () => {
    const fakeUser = {
      email: 'dan@test.com',
      save: jest.fn().mockResolvedValue(true),
      resetPasswordToken: null,
      resetPasswordExpire: null,
    };
    mockUser.findOne.mockResolvedValue(fakeUser);

    const req = mockReq({ body: { email: 'dan@test.com' } });
    const res = mockRes();

    await forgotPassword(req, res);

    expect(fakeUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// reset password
describe('resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when token or newPassword is missing', async () => {
    const req = mockReq({ body: { token: 'abc' } }); // missing newPassword
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token and new password are required' }),
    );
  });

  test('returns 400 when token is invalid or expired', async () => {
    mockUser.findOne.mockResolvedValue(null);

    const req = mockReq({ body: { token: 'bad-token', newPassword: 'newpass12' } });
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid or expired token' }),
    );
  });

  test('returns 200 on successful reset and invalidates tokens', async () => {
    const fakeUser = {
      _id: 'user1',
      save: jest.fn().mockResolvedValue(true),
      password: null,
      resetPasswordToken: 'hashed',
      resetPasswordExpire: Date.now() + 60000,
    };
    mockUser.findOne.mockResolvedValue(fakeUser);
    mockRefreshToken.deleteMany.mockResolvedValue({});

    const req = mockReq({ body: { token: 'valid-token', newPassword: 'newpass12' } });
    const res = mockRes();

    await resetPassword(req, res);

    expect(fakeUser.save).toHaveBeenCalled();
    expect(fakeUser.resetPasswordToken).toBeUndefined();
    expect(fakeUser.resetPasswordExpire).toBeUndefined();
    expect(mockRefreshToken.deleteMany).toHaveBeenCalledWith({ user: 'user1' });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
