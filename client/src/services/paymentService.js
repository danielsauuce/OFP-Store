import axiosInstance from './axiosInstance';

export const createPaymentIntentService = async (orderId) => {
  const { data } = await axiosInstance.post('/api/payments/create-payment-intent', { orderId });
  return data;
};

export const confirmPaymentSuccessService = async (stripePaymentIntentId) => {
  try {
    const { data } = await axiosInstance.post('/api/payments/confirm-success', {
      stripePaymentIntentId,
    });
    return data;
  } catch (error) {
    // Non-critical — webhook may handle it; do not block UX
    // But log for diagnostics
    console.error('Payment confirmation error (non-blocking):', {
      stripePaymentIntentId,
      message: error?.message,
      status: error?.response?.status,
    });
    return null;
  }
};
