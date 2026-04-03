import axiosInstance from '../../src/services/axiosInstance';
import { createPaymentIntentService } from '../../src/services/paymentService';

jest.mock('../../src/services/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => jest.clearAllMocks());

// createPaymentIntentService tests
describe('createPaymentIntentService', () => {
  test('calls POST /api/payments/create-payment-intent with orderId', async () => {
    const fakeResponse = { success: true, clientSecret: 'pi_test123_secret' };
    axiosInstance.post.mockResolvedValue({ data: fakeResponse });

    const result = await createPaymentIntentService('ord123');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/payments/create-payment-intent', {
      orderId: 'ord123',
    });
    expect(result.clientSecret).toBe('pi_test123_secret');
  });

  test('returns the full response data', async () => {
    axiosInstance.post.mockResolvedValue({
      data: { success: true, clientSecret: 'pi_abc_secret' },
    });

    const result = await createPaymentIntentService('ord456');

    expect(result.success).toBe(true);
    expect(result.clientSecret).toBe('pi_abc_secret');
  });

  test('propagates error when request fails', async () => {
    axiosInstance.post.mockRejectedValue(new Error('Network Error'));

    await expect(createPaymentIntentService('ord789')).rejects.toThrow('Network Error');
  });

  test('propagates 400 error for missing orderId', async () => {
    const error = { response: { status: 400, data: { message: 'orderId is required' } } };
    axiosInstance.post.mockRejectedValue(error);

    await expect(createPaymentIntentService(null)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });
});
