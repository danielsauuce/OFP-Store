import axiosInstance from '../../src/services/axiosInstance';
import {
  registerService,
  loginService,
  logoutService,
  checkAuthService,
  changePasswordService,
  forgotPasswordService,
  resetPasswordService,
} from '../../src/services/authService';

// Mock the axiosInstance
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

// registerService tests
describe('registerService', () => {
  const formData = { fullName: 'Daniel Olayinka', email: 'dan@test.com', password: 'Pass123!' };

  test('calls POST /api/auth/register with correct payload and returns data', async () => {
    const mockResponse = { success: true, message: 'Registered' };
    axiosInstance.post.mockResolvedValue({ data: mockResponse });

    const result = await registerService(formData);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/register', {
      fullName: 'Daniel Olayinka',
      email: 'dan@test.com',
      password: 'Pass123!',
    });
    expect(result).toEqual(mockResponse);
  });

  test('throws on API error', async () => {
    const error = new Error('Network Error');
    error.response = { data: { message: 'Email already exists' } };
    axiosInstance.post.mockRejectedValue(error);

    await expect(registerService(formData)).rejects.toThrow('Network Error');
  });
});

// loginService tests
describe('loginService', () => {
  const formData = { email: 'dan@test.com', password: 'Pass123!' };

  test('calls POST /api/auth/login and returns data with tokens', async () => {
    const mockResponse = {
      success: true,
      accessToken: 'abc123',
      refreshToken: 'ref456',
      user: { fullName: 'Daniel' },
    };
    axiosInstance.post.mockResolvedValue({ data: mockResponse });

    const result = await loginService(formData);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'dan@test.com',
      password: 'Pass123!',
    });
    expect(result).toEqual(mockResponse);
    expect(result.accessToken).toBe('abc123');
  });

  test('throws on invalid credentials', async () => {
    const error = new Error('Unauthorized');
    error.response = { data: { message: 'Invalid email or password' } };
    axiosInstance.post.mockRejectedValue(error);

    await expect(loginService(formData)).rejects.toThrow('Unauthorized');
  });
});

// logoutService tests
describe('logoutService', () => {
  test('calls POST /api/auth/logout', async () => {
    const mockResponse = { success: true, message: 'Logged out' };
    axiosInstance.post.mockResolvedValue({ data: mockResponse });

    const result = await logoutService();

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/logout');
    expect(result).toEqual(mockResponse);
  });
});

// checkAuthService tests
describe('checkAuthService', () => {
  test('calls GET /api/auth/me and returns user data', async () => {
    const mockResponse = { success: true, user: { fullName: 'Daniel', role: 'customer' } };
    axiosInstance.get.mockResolvedValue({ data: mockResponse });

    const result = await checkAuthService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/auth/me');
    expect(result.user.fullName).toBe('Daniel');
  });

  test('throws on 401 (expired session)', async () => {
    const error = new Error('Unauthorized');
    error.response = { status: 401, data: { message: 'Session expired' } };
    axiosInstance.get.mockRejectedValue(error);

    await expect(checkAuthService()).rejects.toThrow('Unauthorized');
  });
});

// changePasswordService tests
describe('changePasswordService', () => {
  test('calls POST /api/auth/change-password with passwords', async () => {
    const mockResponse = { success: true, message: 'Password changed' };
    axiosInstance.post.mockResolvedValue({ data: mockResponse });

    const result = await changePasswordService({
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass2!',
    });

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/change-password', {
      currentPassword: 'OldPass1!',
      newPassword: 'NewPass2!',
    });
    expect(result.success).toBe(true);
  });
});

// forgotPasswordService tests
describe('forgotPasswordService', () => {
  test('calls POST /api/auth/forgot-password with email', async () => {
    const mockResponse = { success: true, message: 'Reset email sent' };
    axiosInstance.post.mockResolvedValue({ data: mockResponse });

    const result = await forgotPasswordService('dan@test.com');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
      email: 'dan@test.com',
    });
    expect(result.success).toBe(true);
  });
});

// resetPasswordService tests
describe('resetPasswordService', () => {
  test('calls POST /api/auth/reset-password with token and new password', async () => {
    const mockResponse = { success: true, message: 'Password reset successful' };
    axiosInstance.post.mockResolvedValue({ data: mockResponse });

    const result = await resetPasswordService('reset-token-xyz', 'NewPass3!');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/reset-password', {
      token: 'reset-token-xyz',
      newPassword: 'NewPass3!',
    });
    expect(result.success).toBe(true);
  });
});
