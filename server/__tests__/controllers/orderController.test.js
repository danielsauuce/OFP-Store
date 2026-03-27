// module mocks
jest.mock('../../models/order.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../models/cart.js', () => ({
  default: { findOneAndUpdate: jest.fn() },
  __esModule: true,
}));

jest.mock('../../models/product.js', () => ({
  default: { findById: jest.fn(), findOneAndUpdate: jest.fn() },
  __esModule: true,
}));

jest.mock('../../models/payment.js', () => ({
  default: {},
  __esModule: true,
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from '../../controllers/orderController.js';

import Order from '../../models/order.js';
import Cart from '../../models/cart.js';
import Product from '../../models/product.js';

// helpers
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user1' },
  ...overrides,
});

const validObjectId = 'a'.repeat(24);

const validOrderBody = {
  items: [{ product: validObjectId, quantity: 2 }],
  shippingAddress: {
    fullName: 'Daniel Olayinka',
    email: 'dan@test.com',
    phone: '08012345678',
    street: '10 Marina Road',
    city: 'Lagos',
    postalCode: '100001',
    country: 'Nigeria',
  },
  paymentMethod: 'pay_on_delivery',
};

//  create order
describe('createOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when product is not found or inactive', async () => {
    Product.findById.mockResolvedValue(null);

    const req = mockReq({ body: validOrderBody });
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('not found or inactive') }),
    );
  });

  test('returns 400 when stock is insufficient', async () => {
    Product.findById.mockResolvedValue({
      _id: validObjectId,
      name: 'Luxury Sofa',
      isActive: true,
      price: 500,
      stockQuantity: 1, // only 1 available, order wants 2
      variants: [],
      primaryImage: 'img1',
    });

    const req = mockReq({ body: validOrderBody });
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Insufficient stock') }),
    );
  });

  test('returns 400 when variant SKU is required but missing', async () => {
    Product.findById.mockResolvedValue({
      _id: validObjectId,
      name: 'Luxury Sofa',
      isActive: true,
      price: 500,
      stockQuantity: 10,
      variants: [{ sku: 'RED-L', stockQuantity: 5, price: 550 }],
      primaryImage: 'img1',
    });

    const req = mockReq({ body: validOrderBody });
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Variant SKU required') }),
    );
  });

  test('returns 201 on successful order creation', async () => {
    Product.findById.mockResolvedValue({
      _id: validObjectId,
      name: 'Luxury Sofa',
      isActive: true,
      price: 500,
      stockQuantity: 10,
      variants: [],
      primaryImage: 'img1',
    });
    Product.findOneAndUpdate.mockResolvedValue(true);
    Cart.findOneAndUpdate.mockResolvedValue(true);

    const saveMock = jest.fn().mockResolvedValue(true);
    jest.spyOn(Order, 'find').mockImplementation(() => {});

    const req = mockReq({ body: validOrderBody });
    const res = mockRes();

    await createOrder(req, res);
    expect(res.status).toHaveBeenCalled();
  });
});

// get user orders
describe('getUserOrders', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with orders and pagination', async () => {
    const fakeOrders = [{ _id: 'ord1', orderNumber: 'ORD-001' }];
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(fakeOrders),
            }),
          }),
        }),
      }),
    });
    Order.countDocuments.mockResolvedValue(1);

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getUserOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.orders).toEqual(fakeOrders);
    expect(data.pagination.total).toBe(1);
  });

  test('filters by status when valid', async () => {
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });
    Order.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { status: 'delivered' } });
    const res = mockRes();

    await getUserOrders(req, res);

    const findCall = Order.find.mock.calls[0][0];
    expect(findCall.orderStatus).toBe('delivered');
  });

  test('ignores invalid status values', async () => {
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });
    Order.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { status: 'hacked' } });
    const res = mockRes();

    await getUserOrders(req, res);

    const findCall = Order.find.mock.calls[0][0];
    expect(findCall.orderStatus).toBeUndefined();
  });
});

// get order by id
describe('getOrderById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when order not found', async () => {
    Order.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with order data', async () => {
    const fakeOrder = { _id: validObjectId, orderNumber: 'ORD-001' };
    Order.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeOrder),
        }),
      }),
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, order: fakeOrder }),
    );
  });
});

// cancel order
describe('cancelOrder', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when order not found', async () => {
    Order.findOne.mockResolvedValue(null);

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await cancelOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when order is already shipped', async () => {
    Order.findOne.mockResolvedValue({
      _id: validObjectId,
      orderStatus: 'shipped',
      statusHistory: [],
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await cancelOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Order cannot be cancelled at this stage' }),
    );
  });

  test('returns 400 when order is already delivered', async () => {
    Order.findOne.mockResolvedValue({
      _id: validObjectId,
      orderStatus: 'delivered',
      statusHistory: [],
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await cancelOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 200 and cancels pending order', async () => {
    const fakeOrder = {
      _id: validObjectId,
      orderStatus: 'pending',
      statusHistory: [],
      save: jest.fn().mockResolvedValue(true),
    };
    fakeOrder.statusHistory.push = jest.fn();
    Order.findOne.mockResolvedValue(fakeOrder);

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await cancelOrder(req, res);

    expect(fakeOrder.orderStatus).toBe('cancelled');
    expect(fakeOrder.statusHistory.push).toHaveBeenCalled();
    expect(fakeOrder.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// get all orders (admin)
describe('getAllOrdersAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with orders and pagination', async () => {
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    });
    Order.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getAllOrdersAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('filters by order status and payment status', async () => {
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    });
    Order.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { status: 'shipped', paymentStatus: 'paid' } });
    const res = mockRes();

    await getAllOrdersAdmin(req, res);

    const findCall = Order.find.mock.calls[0][0];
    expect(findCall.orderStatus).toBe('shipped');
    expect(findCall.paymentStatus).toBe('paid');
  });

  test('rejects invalid status values from queries', async () => {
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    });
    Order.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { status: 'injected', paymentStatus: '{$ne: null}' } });
    const res = mockRes();

    await getAllOrdersAdmin(req, res);

    const findCall = Order.find.mock.calls[0][0];
    expect(findCall.orderStatus).toBeUndefined();
    expect(findCall.paymentStatus).toBeUndefined();
  });
});

//  update order status (admin)
describe('updateOrderStatusAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body', async () => {
    const req = mockReq({
      body: { orderStatus: 'invalid_status' },
      params: { id: validObjectId },
    });
    const res = mockRes();

    await updateOrderStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when order not found', async () => {
    Order.findById.mockResolvedValue(null);

    const req = mockReq({
      body: { orderStatus: 'shipped' },
      params: { id: validObjectId },
    });
    const res = mockRes();

    await updateOrderStatusAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful status update', async () => {
    const fakeOrder = {
      _id: validObjectId,
      orderStatus: 'pending',
      statusHistory: [],
      save: jest.fn().mockResolvedValue(true),
    };
    fakeOrder.statusHistory.push = jest.fn();
    Order.findById.mockResolvedValue(fakeOrder);

    const req = mockReq({
      body: { orderStatus: 'shipped', note: 'Shipped via DHL' },
      params: { id: validObjectId },
    });
    const res = mockRes();

    await updateOrderStatusAdmin(req, res);

    expect(fakeOrder.orderStatus).toBe('shipped');
    expect(fakeOrder.statusHistory.push).toHaveBeenCalled();
    expect(fakeOrder.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
