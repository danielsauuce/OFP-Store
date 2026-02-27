import axiosInstance from './axiosInstance';

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
