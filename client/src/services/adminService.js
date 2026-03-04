import axiosInstance from './axiosInstance';

// Dashboard
export async function getDashboardStatsService() {
  try {
    const { data } = await axiosInstance.get('/api/admin/dashboard/stats');
    return data;
  } catch (error) {
    console.error('getDashboardStats error:', error?.response?.data || error.message);
    throw error;
  }
}

// User Management
export async function getAllUsersAdminService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/admin/users', { params });
    return data;
  } catch (error) {
    console.error('getAllUsersAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getUserByIdAdminService(userId) {
  try {
    const { data } = await axiosInstance.get(`/api/admin/users/${userId}`);
    return data;
  } catch (error) {
    console.error('getUserByIdAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateUserStatusService(userId, isActive) {
  try {
    const { data } = await axiosInstance.patch(`/api/admin/users/${userId}/status`, { isActive });
    return data;
  } catch (error) {
    console.error('updateUserStatus error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateUserRoleService(userId, role) {
  try {
    const { data } = await axiosInstance.patch(`/api/admin/users/${userId}/role`, { role });
    return data;
  } catch (error) {
    console.error('updateUserRole error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function deleteUserAdminService(userId) {
  try {
    const { data } = await axiosInstance.delete(`/api/admin/users/delete/${userId}`);
    return data;
  } catch (error) {
    console.error('deleteUserAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

// Product Management (Admin)
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

// Order Management (Admin)
export async function getAllOrdersAdminService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/orders/admin', { params });
    return data;
  } catch (error) {
    console.error('getAllOrdersAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateOrderStatusAdminService(orderId, orderStatus, note) {
  try {
    const body = { orderStatus };
    if (note) body.note = note;

    const { data } = await axiosInstance.patch(`/api/orders/admin/${orderId}/status`, body);
    return data;
  } catch (error) {
    console.error('updateOrderStatusAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

// Category Management (Admin)
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

// Review Moderation (Admin)
export async function getAllReviewsAdminService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/reviews/admin', { params });
    return data;
  } catch (error) {
    console.error('getAllReviewsAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function approveReviewService(reviewId, isApproved) {
  try {
    const { data } = await axiosInstance.patch(`/api/reviews/admin/${reviewId}/approve`, {
      isApproved,
    });
    return data;
  } catch (error) {
    console.error('approveReview error:', error?.response?.data || error.message);
    throw error;
  }
}

// Support Ticket Management (Admin)
export async function getAllTicketsAdminService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/support/admin', { params });
    return data;
  } catch (error) {
    console.error('getAllTicketsAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getTicketAdminService(ticketId) {
  try {
    const { data } = await axiosInstance.get(`/api/support/admin/${ticketId}`);
    return data;
  } catch (error) {
    console.error('getTicketAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function updateTicketAdminService(ticketId, updateData) {
  try {
    const { data } = await axiosInstance.patch(`/api/support/admin/${ticketId}`, updateData);
    return data;
  } catch (error) {
    console.error('updateTicketAdmin error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function addAdminReplyService(ticketId, text) {
  try {
    const { data } = await axiosInstance.post(`/api/support/admin/${ticketId}/reply`, { text });
    return data;
  } catch (error) {
    console.error('addAdminReply error:', error?.response?.data || error.message);
    throw error;
  }
}

// Media Management (Admin)
export async function getAllMediaService(params = {}) {
  try {
    const { data } = await axiosInstance.get('/api/media/upload/all', { params });
    return data;
  } catch (error) {
    console.error('getAllMedia error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function uploadSingleImageService(file, folder = 'general') {
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const { data } = await axiosInstance.post('/api/media/upload/single', formData);
    return data;
  } catch (error) {
    console.error('uploadSingleImage error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function uploadMultipleImagesService(files, folder = 'general') {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('folder', folder);

    const { data } = await axiosInstance.post('/api/media/upload/multiple', formData);
    return data;
  } catch (error) {
    console.error('uploadMultipleImages error:', error?.response?.data || error.message);
    throw error;
  }
}
