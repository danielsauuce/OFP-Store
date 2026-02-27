import axiosInstance from './axiosInstance';

export async function getUserProfileService() {
  try {
    const { data } = await axiosInstance.get('/api/users/profile');
    return data;
  } catch (error) {
    console.error('getUserProfile error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateUserProfileService(profileData) {
  try {
    const { data } = await axiosInstance.put('/api/users/profile', profileData);
    return data;
  } catch (error) {
    console.error('updateUserProfile error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function uploadProfilePictureService(file) {
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const { data } = await axiosInstance.patch('/api/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch (error) {
    console.error('uploadProfilePicture error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function deleteProfilePictureService() {
  try {
    const { data } = await axiosInstance.delete('/api/users/profile-picture');
    return data;
  } catch (error) {
    console.error('deleteProfilePicture error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getAddressesService() {
  try {
    const { data } = await axiosInstance.get('/api/users/addresses');
    return data;
  } catch (error) {
    console.error('getAddresses error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function addAddressService(addressData) {
  try {
    const { data } = await axiosInstance.post('/api/users/addresses', addressData);
    return data;
  } catch (error) {
    console.error('addAddress error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateAddressService(addressId, addressData) {
  try {
    const { data } = await axiosInstance.put(`/api/users/addresses/${addressId}`, addressData);
    return data;
  } catch (error) {
    console.error('updateAddress error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function deleteAddressService(addressId) {
  try {
    const { data } = await axiosInstance.delete(`/api/users/addresses/${addressId}`);
    return data;
  } catch (error) {
    console.error('deleteAddress error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function setDefaultAddressService(addressId) {
  try {
    const { data } = await axiosInstance.patch(`/api/users/addresses/${addressId}/default`);
    return data;
  } catch (error) {
    console.error('setDefaultAddress error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function deactivateAccountService() {
  try {
    const { data } = await axiosInstance.delete('/api/users/account');
    return data;
  } catch (error) {
    console.error('deactivateAccount error:', error?.response?.data || error.message);
    throw error;
  }
}
