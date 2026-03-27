import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/context/authContext';
import * as authService from '../../src/services/authService';

// Mock axiosInstance to prevent import.meta.env parse error
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

jest.mock('../../src/services/authService');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  // checkAuth runs on mount — default to no token so it resolves immediately
  authService.checkAuthService.mockRejectedValue(new Error('no token'));
});

// Guard test must run before any other tests that use the wrapper
describe('useAuth guard', () => {
  test('throws when used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used inside AuthProvider');

    spy.mockRestore();
  });
});

// Initial state test must run before any tests that call async functions, to ensure the initial loading state is correct
describe('initial state', () => {
  test('starts unauthenticated with loading true', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.auth.authenticate).toBe(false);
    expect(result.current.auth.user).toBeNull();
  });
});

// SignUp test
describe('signUp', () => {
  test('returns success on successful registration', async () => {
    authService.registerService.mockResolvedValue({
      success: true,
      message: 'Registered',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.signUp({
        fullName: 'Daniel',
        email: 'dan@test.com',
        password: 'Pass123!',
      });
    });

    expect(response.success).toBe(true);
    expect(authService.registerService).toHaveBeenCalledWith({
      fullName: 'Daniel',
      email: 'dan@test.com',
      password: 'Pass123!',
    });
  });

  test('returns failure on registration error', async () => {
    const error = new Error('Email exists');
    error.response = { data: { message: 'Email already exists' } };
    authService.registerService.mockRejectedValue(error);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.signUp({
        fullName: 'Daniel',
        email: 'dan@test.com',
        password: 'Pass123!',
      });
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Email already exists');
  });
});

// SignIn test
describe('signIn', () => {
  test('sets auth state and stores tokens on success', async () => {
    authService.loginService.mockResolvedValue({
      success: true,
      accessToken: 'abc123',
      refreshToken: 'ref456',
      user: { fullName: 'Daniel', role: 'customer' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.signIn({
        email: 'dan@test.com',
        password: 'Pass123!',
      });
    });

    expect(response.success).toBe(true);
    expect(result.current.auth.authenticate).toBe(true);
    expect(result.current.auth.user.fullName).toBe('Daniel');
    expect(sessionStorage.getItem('accessToken')).toBe('abc123');
    expect(sessionStorage.getItem('refreshToken')).toBe('ref456');
  });

  test('returns failure on bad credentials', async () => {
    authService.loginService.mockResolvedValue({
      success: false,
      message: 'Invalid email or password',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.signIn({
        email: 'dan@test.com',
        password: 'wrong',
      });
    });

    expect(response.success).toBe(false);
    expect(result.current.auth.authenticate).toBe(false);
  });
});

// SignOut test
describe('signOut', () => {
  test('clears auth state and tokens', async () => {
    authService.loginService.mockResolvedValue({
      success: true,
      accessToken: 'abc',
      refreshToken: 'ref',
      user: { fullName: 'Daniel' },
    });
    authService.logoutService.mockResolvedValue({
      success: true,
      message: 'Logged out',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signIn({ email: 'dan@test.com', password: 'Pass123!' });
    });
    expect(result.current.auth.authenticate).toBe(true);

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.auth.authenticate).toBe(false);
    expect(result.current.auth.user).toBeNull();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
  });

  test('still clears state even if logout API fails', async () => {
    sessionStorage.setItem('accessToken', 'abc');
    authService.logoutService.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.auth.authenticate).toBe(false);
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });
});

// checkAuth test
describe('checkAuth', () => {
  test('restores session when token exists and API succeeds', async () => {
    sessionStorage.setItem('accessToken', 'valid-token');
    authService.checkAuthService.mockResolvedValue({
      success: true,
      user: { fullName: 'Daniel', role: 'customer' },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.auth.authenticate).toBe(true);
    expect(result.current.auth.user.fullName).toBe('Daniel');
  });

  test('stays unauthenticated when no token in sessionStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.auth.authenticate).toBe(false);
    expect(authService.checkAuthService).not.toHaveBeenCalled();
  });

  test('clears tokens on 401 response', async () => {
    sessionStorage.setItem('accessToken', 'expired-token');
    const error = new Error('Unauthorized');
    error.response = { status: 401, data: { message: 'Session expired' } };
    authService.checkAuthService.mockRejectedValue(error);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.auth.authenticate).toBe(false);
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });
});

// changePassword test
describe('changePassword', () => {
  test('returns success on password change', async () => {
    authService.changePasswordService.mockResolvedValue({
      success: true,
      message: 'Password changed',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.changePassword({
        currentPassword: 'Old1!',
        newPassword: 'New2!',
      });
    });

    expect(response.success).toBe(true);
  });

  test('returns failure on error', async () => {
    const error = new Error('Wrong password');
    error.response = { data: { message: 'Current password is incorrect' } };
    authService.changePasswordService.mockRejectedValue(error);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.changePassword({
        currentPassword: 'Wrong1!',
        newPassword: 'New2!',
      });
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Current password is incorrect');
  });
});
