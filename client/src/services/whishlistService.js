import axiosInstance from './axiosInstance';

export async function getWishlistService() {
  try {
    const { data } = await axiosInstance.get('/api/wishlist');
    return data;
  } catch (error) {
    console.error('getWishlist error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function addToWishlistService(productId) {
  try {
    const { data } = await axiosInstance.post('/api/wishlist', { productId });
    return data;
  } catch (error) {
    console.error('addToWishlist error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function removeFromWishlistService(productId) {
  try {
    const { data } = await axiosInstance.delete(`/api/wishlist/${productId}`);
    return data;
  } catch (error) {
    console.error('removeFromWishlist error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function clearWishlistService() {
  try {
    const { data } = await axiosInstance.delete('/api/wishlist');
    return data;
  } catch (error) {
    console.error('clearWishlist error:', error?.response?.data || error.message);
    throw error;
  }
}
