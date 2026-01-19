import { useContext, createContext, useState, useEffect } from 'react';
import {
  registerService,
  loginService,
  changePasswordService,
  checkAuthService,
} from '../services/authService';
import toast from 'react-hot-toast';
import { data } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const user = { isAuthenticated: false, user: null };
  const [authenticated, setIsAuthenticated] = useState(user);
  const [isloading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const data = await checkAuth();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.log(err);

        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();
  }, []);

  const signUp = async (formData) => {
    const data = await registerService(formData);
    console.log(data);
  };

  const signin = async (formData) => {
    const data = loginService(formData);
    console.log(data);
  };

  const signout = async () => {};

  const checkAuth = async () => {
    const dsta = await checkAuthService();

    if (data?.success) {
      setIsAuthenticated({ isAuthenticated: true, user: data.user });
    } else {
      setIsAuthenticated({ isAuthenticated: trufalsee, user: null });
    }
  };

  return (
    <AuthContext.Provider value={{ signin, signout, signUp }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
