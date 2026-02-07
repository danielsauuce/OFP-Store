import axiosInstance from './axiosInstance';

export async function getCartService() {
  try {
    const { data } = await axiosInstance.get('/api/cart');
    return data;
  } catch (error) {
    console.error('getCart error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function addToCartService(product, quantity = 1, variantSku = null) {
  try {
    const body = { product, quantity };
    if (variantSku) body.variantSku = variantSku;

    const { data } = await axiosInstance.post('/api/cart/items', body);
    return data;
  } catch (error) {
    console.error('addToCart error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateCartItemService(productId, quantity) {
  try {
    const { data } = await axiosInstance.put(`/api/cart/items/${productId}`, { quantity });
    return data;
  } catch (error) {
    console.error('updateCartItem error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function removeCartItemService(productId) {
  try {
    const { data } = await axiosInstance.delete(`/api/cart/items/${productId}`);
    return data;
  } catch (error) {
    console.error('removeCartItem error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function clearCartService() {
  try {
    const { data } = await axiosInstance.delete('/api/cart');
    return data;
  } catch (error) {
    console.error('clearCart error:', error?.response?.data || error.message);
    throw error;
  }
}
