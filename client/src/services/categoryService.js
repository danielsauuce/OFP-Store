import axiosInstance from './axiosInstance';

// ─── Public Endpoints ───────────────────────────────────────

export async function getAllCategoriesService() {
  try {
    const { data } = await axiosInstance.get('/api/categories');
    return data;
  } catch (error) {
    console.error('getAllCategories error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getCategoryBySlugService(slug) {
  try {
    const { data } = await axiosInstance.get(`/api/categories/${slug}`);
    return data;
  } catch (error) {
    console.error('getCategoryBySlug error:', error?.response?.data || error.message);
    throw error;
  }
}

// ─── Admin Endpoints ────────────────────────────────────────

export async function getAllCategoriesAdminService() {
  try {
    const { data } = await axiosInstance.get('/api/categories/admin/all');
    return data;
  } catch (error) {
    console.error('getAllCategoriesAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function createCategoryService(categoryData) {
  try {
    const { data } = await axiosInstance.post('/api/categories', categoryData);
    return data;
  } catch (error) {
    console.error('createCategory error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateCategoryService(categoryId, categoryData) {
  try {
    const { data } = await axiosInstance.put(`/api/categories/${categoryId}`, categoryData);
    return data;
  } catch (error) {
    console.error('updateCategory error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function deleteCategoryService(categoryId) {
  try {
    const { data } = await axiosInstance.delete(`/api/categories/${categoryId}`);
    return data;
  } catch (error) {
    console.error('deleteCategory error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function reorderCategoryService(categoryId, orderData) {
  try {
    const { data } = await axiosInstance.patch(`/api/categories/${categoryId}/order`, orderData);
    return data;
  } catch (error) {
    console.error('reorderCategory error:', error?.response?.data || error.message);
    throw error;
  }
}
