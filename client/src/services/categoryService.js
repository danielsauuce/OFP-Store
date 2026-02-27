import axiosInstance from './axiosInstance';

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
