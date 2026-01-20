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
    authenticated: false,
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
      console.log(data);

      if (data?.success) {
        toast.success('Registration successful! Please login.');
        return { success: true, data };
      } else {
        toast.error('Registration failed');

        return { success: false };
      }
    } catch (error) {
      toast.error('Registration failed');
      console.error('SignUp error:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (loginFormData) => {
    setIsLoading(true);

    try {
      const data = await loginService(loginFormData);
      console.log(data);

      if (data?.success && data?.accessToken) {
        sessionStorage.setItem('accessToken', data.accessToken);
        sessionStorage.setItem('refreshToken', data.refreshToken);

        setAuth({
          authenticated: true,
          user: data.user,
        });

        const succesmsg = data?.user.fullName;

        toast.success(`Welcome Back ${succesmsg} 👏`);
        return { success: true, data };
      } else {
        toast.error('Login failed');
        return { success: false };
      }
    } catch (error) {
      toast.error('Login failed');
      console.error('SignIn error:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);

    try {
      await logoutService();

      // Clear tokens
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      setAuth({
        authenticated: false,
        user: null,
      });

      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // session still clears if API call fails
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      setAuth({
        authenticated: false,
        user: null,
      });
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
        setAuth({ authenticated: false, user: null });
        return;
      }

      const data = await checkAuthService();

      if (data?.success && data?.user) {
        setAuth({
          authenticated: true,
          user: data.user,
        });
      } else {
        // Invalid token, clear storage
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');

        setAuth({ authenticated: false, user: null });
      }
    } catch (error) {
      console.error('Check auth error:', error);

      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      setAuth({ authenticated: false, user: null });
    } finally {
      setIsLoading(false);
    }
  };

  // change password

  return (
    <AuthContext.Provider
      value={{
        auth,
        isLoading,
        signUp,
        signIn,
        signOut,
        checkAuth,
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
