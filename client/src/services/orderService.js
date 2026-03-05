import axiosInstance from './axiosInstance';

// User Endpoints
export async function createOrderService(orderData) {
  try {
    const { data } = await axiosInstance.post('/api/orders', orderData);
    return data;
  } catch (error) {
    console.error('createOrder error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getUserOrdersService(page = 1, limit = 10, status) {
  try {
    const params = { page, limit };
    if (status) params.status = status;

    const { data } = await axiosInstance.get('/api/orders', { params });
    return data;
  } catch (error) {
    console.error('getUserOrders error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function getOrderByIdService(orderId) {
  try {
    const { data } = await axiosInstance.get(`/api/orders/${orderId}`);
    return data;
  } catch (error) {
    console.error('getOrderById error:', error?.response?.data || error.message);
    throw error;
  }
}

export async function cancelOrderService(orderId) {
  try {
    const { data } = await axiosInstance.patch(`/api/orders/${orderId}/cancel`);
    return data;
  } catch (error) {
    console.error('cancelOrder error:', error?.response?.data || error.message);
    throw error;
  }
}

// Admin Endpoints
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
