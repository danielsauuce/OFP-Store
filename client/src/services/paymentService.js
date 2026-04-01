import axiosInstance from './axiosInstance';

export const createPaymentIntentService = async (orderId) => {
  const { data } = await axiosInstance.post('/api/payments/create-payment-intent', { orderId });
  return data;
};
