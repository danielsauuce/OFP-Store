import axiosInstance from './axiosInstance';

export async function registerService(registerFormData) {
  try {
    const { fullName, email, password, phone } = registerFormData;

    const { data } = await axiosInstance.post('/api/auth/register', {
      fullName,
      email,
      password,
      phone,
    });

    return data;
  } catch (error) {
    console.error('registerService error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function loginService(loginFormData) {
  try {
    const { email, password } = loginFormData;

    const { data } = await axiosInstance.post('/api/auth/login', {
      email,
      password,
    });

    return data;
  } catch (error) {
    console.error('loginService error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function logoutService() {
  try {
    const { data } = await axiosInstance.get('/api/auth/logout');
    return data;
  } catch (error) {
    console.error('logoutService error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function checkAuthService() {
  try {
    const { data } = await axiosInstance.get('/api/auth/me');
    return data;
  } catch (error) {
    console.error('checkAuthService error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function changePasswordService(formData) {
  try {
    const { currentPassword, newPassword } = formData;

    const { data } = await axiosInstance.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  } catch (error) {
    console.error('changePasswordService error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function forgotPasswordService(email) {
  try {
    const { data } = await axiosInstance.post('/api/auth/forgot-password', {
      email,
    });
    return data;
  } catch (error) {
    console.error('forgotPasswordService error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function resetPasswordService(token, newPassword) {
  try {
    const { data } = await axiosInstance.post('/api/auth/reset-password', {
      token,
      newPassword,
    });
    return data;
  } catch (error) {
    console.error('resetPasswordService error:', error?.response?.data || error.message);
    throw error;
  }
}
