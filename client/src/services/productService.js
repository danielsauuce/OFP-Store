import axiosInstance from './axiosInstance';

export async function getAllProductsService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/product', { params });
    return data;
  } catch (error) {
    console.error('getAllProducts error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getProductByIdService(productId) {
  try {
    const { data } = await axiosInstance.get(`/api/product/${productId}`);
    return data;
  } catch (error) {
    console.error('getProductById error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getProductsByCategoryService(slug, params = {}) {
  try {
    const { data } = await axiosInstance.get(`/api/product/category/${slug}`, { params });
    return data;
  } catch (error) {
    console.error('getProductsByCategory error:', error?.response?.data || error.message);
    throw error;
  }
}
9;
