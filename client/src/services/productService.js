import axiosInstance from './axiosInstance';

// Public Endpoints

export async function getAllProductsService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/product', { params });
    console.log(data);
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

// Admin Endpoints

export async function getAllProductsAdminService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/admin/products', { params });
    return data;
  } catch (error) {
    console.error('getAllProductsAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getProductByIdAdminService(productId) {
  try {
    const { data } = await axiosInstance.get(`/api/admin/products/${productId}`);
    return data;
  } catch (error) {
    console.error('getProductByIdAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function createProductService(productData) {
  try {
    const { data } = await axiosInstance.post('/api/admin/products/create', productData);
    return data;
  } catch (error) {
    console.error('createProduct error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateProductService(productId, productData) {
  try {
    const { data } = await axiosInstance.put(
      `/api/admin/products/update/${productId}`,
      productData,
    );
    return data;
  } catch (error) {
    console.error('updateProduct error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function deleteProductService(productId) {
  try {
    const { data } = await axiosInstance.delete(`/api/admin/products/delete/${productId}`);
    return data;
  } catch (error) {
    console.error('deleteProduct error:', error?.response?.data || error.message);
    throw error;
  }
}
