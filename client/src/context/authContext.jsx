import { useContext, createContext, useState, useEffect } from 'react';
import {
  registerService,
  loginService,
  changePasswordService,
  checkAuthService,
  logoutService,
} from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });

  // check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const signUp = async (registerFormData) => {
    setIsLoading(true);

    try {
      const data = await registerService(registerFormData);

      if (data?.success) {
        toast.success(data?.message || 'User registered successfully');
        return { success: true, data };
      } else {
        toast.error(data?.message || 'Registration failed');
        return { success: false, error: data?.message };
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (loginFormData) => {
    setIsLoading(true);

    try {
      const data = await loginService(loginFormData);

      if (data?.success && data?.accessToken) {
        sessionStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('refreshToken', data.refreshToken);

        setAuth({
          authenticate: true,
          user: data.user,
        });

        const userName = data?.user?.fullName || 'User';
        toast.success(`Welcome Back ${userName} 👏`);
        return { success: true, data };
      } else {

        toast.error(data?.message || 'Login failed');
        return { success: false, error: data?.message };
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Something went wrong';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);

    try {
      const data = await logoutService();

      // Clear tokens
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      setAuth({
        authenticate: false,
        user: null,
      });

      toast.success(data?.message || 'Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);

      // Still clear session even if API call fails
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      setAuth({
        authenticate: false,
        user: null,
      });

      const errorMessage = error?.response?.data?.message || 'Logout completed (with errors)';
      toast.error(errorMessage);

      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuth = async () => {
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('accessToken');

      if (!token) {
        setAuth({ authenticate: false, user: null });
        setIsLoading(false);
        return;
      }

      const data = await checkAuthService();

      if (data?.success && data?.user) {
        setAuth({
          authenticate: true,
          user: data.user,
        });
      } else if (data?.success === false) {
        toast.error(data?.message || 'Session expired');

        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        setAuth({ authenticate: false, user: null });
      }
    } catch (error) {
      console.error('Check auth error:', error);

      if (error.response?.status === 401) {
        const errorMessage = error?.response?.data?.message || 'Session expired';

        toast.error(errorMessage);

        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        setAuth({ authenticate: false, user: null });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (formData) => {
    setIsLoading(true);

    try {
      const data = await changePasswordService(formData);

      if (data?.success) {
        toast.success(data?.message || 'Password changed successfully');
        return { success: true, data };
      } else {
        toast.error(data?.message || 'Password change failed');
        return { success: false, error: data?.message };
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        isLoading,
        signUp,
        signIn,
        signOut,
        checkAuth,
        changePassword,
        setAuth,
        setIsLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
