import axiosInstance from './axiosInstance';

export async function registerService(registerFormData) {
  try {
    const { fullName, email, password } = registerFormData;

    const { data } = await axiosInstance.post('/api/auth/register', {
      fullName,
      email,
      password,
    });

    return data;
  } catch (error) {
    console.log(error);
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
    console.log(error);
  }
}

export async function logoutService() {
  try {
    const { data } = await axiosInstance.post('/api/auth/logout');

    return data;
  } catch (error) {
    console.log(error?.response);
  }
}

export async function checkAuthService() {
  try {
    const { data } = await axiosInstance.get('/api/auth/check-auth');
    return data;
  } catch (error) {
    console.error('checkAuthService error:', error);
    throw error;
  }
}

export async function changePasswordService(formData) {
  const { currentPassword, newPassword } = formData;

  const { data } = axiosInstance.post('/api/auth/reset-password', { currentPassword, newPassword });
  return data;
}
