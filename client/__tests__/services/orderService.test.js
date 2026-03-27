import axiosInstance from '../../src/services/axiosInstance';
import {
  createOrderService,
  getUserOrdersService,
  getOrderByIdService,
  cancelOrderService,
  getAllOrdersAdminService,
  updateOrderStatusAdminService,
} from '../../src/services/orderService';

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

// createOrderService tests
describe('createOrderService', () => {
  test('calls POST /api/orders with order data', async () => {
    const orderData = { items: [{ product: 'p1', quantity: 2 }], paymentMethod: 'pay_on_delivery' };
    axiosInstance.post.mockResolvedValue({ data: { success: true, order: { _id: 'ord1' } } });

    const result = await createOrderService(orderData);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/orders', orderData);
    expect(result.order._id).toBe('ord1');
  });

  test('throws on validation error', async () => {
    axiosInstance.post.mockRejectedValue(new Error('Validation failed'));
    await expect(createOrderService({})).rejects.toThrow('Validation failed');
  });
});

// getUserOrdersService tests
describe('getUserOrdersService', () => {
  test('calls GET /api/orders with default params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, orders: [] } });

    await getUserOrdersService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/orders', {
      params: { page: 1, limit: 10 },
    });
  });

  test('passes page, limit, and status params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, orders: [] } });

    await getUserOrdersService(2, 5, 'delivered');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/orders', {
      params: { page: 2, limit: 5, status: 'delivered' },
    });
  });

  test('omits status when undefined', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true } });

    await getUserOrdersService(1, 10, undefined);

    const callParams = axiosInstance.get.mock.calls[0][1].params;
    expect(callParams.status).toBeUndefined();
  });
});

// getOrderByIdService tests
describe('getOrderByIdService', () => {
  test('calls GET /api/orders/:id', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, order: { _id: 'ord1' } } });

    const result = await getOrderByIdService('ord1');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/orders/ord1');
    expect(result.order._id).toBe('ord1');
  });
});

// cancelOrderService tests
describe('cancelOrderService', () => {
  test('calls PATCH /api/orders/:id/cancel', async () => {
    axiosInstance.patch.mockResolvedValue({ data: { success: true, message: 'Cancelled' } });

    const result = await cancelOrderService('ord1');

    expect(axiosInstance.patch).toHaveBeenCalledWith('/api/orders/ord1/cancel');
    expect(result.success).toBe(true);
  });
});

// getAllOrdersAdminService tests
describe('getAllOrdersAdminService', () => {
  test('calls GET /api/orders/admin with params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, orders: [] } });

    await getAllOrdersAdminService({ status: 'shipped', page: 1 });

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/orders/admin', {
      params: { status: 'shipped', page: 1 },
    });
  });
});

// updateOrderStatusAdminService tests
describe('updateOrderStatusAdminService', () => {
  test('calls PATCH /api/orders/admin/:id/status with orderStatus', async () => {
    axiosInstance.patch.mockResolvedValue({ data: { success: true } });

    await updateOrderStatusAdminService('ord1', 'shipped');

    expect(axiosInstance.patch).toHaveBeenCalledWith('/api/orders/admin/ord1/status', {
      orderStatus: 'shipped',
    });
  });

  test('includes note when provided', async () => {
    axiosInstance.patch.mockResolvedValue({ data: { success: true } });

    await updateOrderStatusAdminService('ord1', 'shipped', 'Via DHL');

    expect(axiosInstance.patch).toHaveBeenCalledWith('/api/orders/admin/ord1/status', {
      orderStatus: 'shipped',
      note: 'Via DHL',
    });
  });

  test('omits note when not provided', async () => {
    axiosInstance.patch.mockResolvedValue({ data: { success: true } });

    await updateOrderStatusAdminService('ord1', 'delivered');

    const callBody = axiosInstance.patch.mock.calls[0][1];
    expect(callBody.note).toBeUndefined();
  });
});
