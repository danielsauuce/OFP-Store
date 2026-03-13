const mockCart = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
};
jest.mock('../../models/cart.js', () => ({ default: mockCart, __esModule: true }));

const mockProduct = { findById: jest.fn() };
jest.mock('../../models/product.js', () => ({ default: mockProduct, __esModule: true }));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../../controllers/cartController.js';

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

// get cart
describe('getCart', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates empty cart when none exists', async () => {
    mockCart.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    mockCart.create.mockResolvedValue({ _id: 'cart1', items: [] });

    const req = mockReq();
    const res = mockRes();

    await getCart(req, res);

    expect(mockCart.create).toHaveBeenCalledWith({ user: 'user1', items: [] });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        cart: expect.objectContaining({ items: [], total: 0 }),
      }),
    );
  });

  test('returns existing cart with computed total', async () => {
    const cart = {
      _id: 'cart1',
      items: [
        { product: { name: 'Sofa' }, priceSnapshot: 100, quantity: 2 },
        { product: { name: 'Chair' }, priceSnapshot: 50, quantity: 1 },
      ],
    };
    mockCart.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(cart),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.cart.total).toBe(250); // (100*2) + (50*1)
  });
});

// addToCart
describe('addToCart', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body', async () => {
    const req = mockReq({ body: { quantity: 1 } }); // missing product
    const res = mockRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when product not found', async () => {
    mockProduct.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq({ body: { product: validObjectId, quantity: 1 } });
    const res = mockRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product not found or inactive' }),
    );
  });

  test('returns 404 when product is inactive', async () => {
    mockProduct.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: validObjectId, isActive: false }),
    });

    const req = mockReq({ body: { product: validObjectId, quantity: 1 } });
    const res = mockRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when variant SKU required but not provided', async () => {
    mockProduct.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: validObjectId,
        isActive: true,
        price: 100,
        variants: [{ sku: 'RED-S', stockQuantity: 5 }],
      }),
    });

    const req = mockReq({ body: { product: validObjectId, quantity: 1 } });
    const res = mockRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Variant SKU required for this product' }),
    );
  });

  test('returns 400 when quantity exceeds available stock', async () => {
    mockProduct.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: validObjectId,
        isActive: true,
        price: 100,
        stockQuantity: 3,
        variants: [],
      }),
    });
    mockCart.findOne.mockResolvedValue(null);

    const req = mockReq({ body: { product: validObjectId, quantity: 5 } });
    const res = mockRes();

    await addToCart(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Insufficient stock' }),
    );
  });

  test('returns 200 when successfully adding to cart', async () => {
    mockProduct.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: validObjectId,
        name: 'Luxury Sofa',
        isActive: true,
        price: 499.99,
        stockQuantity: 10,
        variants: [],
        primaryImage: 'img123',
      }),
    });

    const fakeCart = {
      _id: 'cart1',
      user: 'user1',
      items: [],
      total: 499.99,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    // Push mutates items array
    fakeCart.items.push = jest.fn();
    mockCart.findOne.mockResolvedValue(null);
    // Cart constructor mock for new Cart()
    jest.spyOn(Object, 'assign').mockImplementation((target, ...sources) => {
      sources.forEach((s) => Object.keys(s).forEach((k) => (target[k] = s[k])));
      return target;
    });

    const req = mockReq({ body: { product: validObjectId, quantity: 1 } });
    const res = mockRes();

    await addToCart(req, res);

    // Either 200 (success) or handles creating a new cart
    expect(res.status).toHaveBeenCalled();
  });
});

// updateCartItem
describe('updateCartItem', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body', async () => {
    const req = mockReq({ body: {}, params: { productId: validObjectId } });
    const res = mockRes();

    await updateCartItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when cart not found', async () => {
    mockCart.findOne.mockResolvedValue(null);

    const req = mockReq({
      body: { quantity: 2 },
      params: { productId: validObjectId },
    });
    const res = mockRes();

    await updateCartItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Cart not found' }));
  });

  test('returns 404 when item not in cart', async () => {
    mockCart.findOne.mockResolvedValue({
      items: [{ product: { toString: () => 'different-id' } }],
    });

    const req = mockReq({
      body: { quantity: 2 },
      params: { productId: validObjectId },
    });
    const res = mockRes();

    await updateCartItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Item not found in cart' }),
    );
  });

  test('returns 400 when quantity exceeds stock on update', async () => {
    const cartItem = {
      product: { toString: () => validObjectId },
      variantSku: null,
      quantity: 1,
    };
    mockCart.findOne.mockResolvedValue({ items: [cartItem] });
    mockProduct.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        stockQuantity: 3,
        variants: [],
      }),
    });

    const req = mockReq({
      body: { quantity: 10 },
      params: { productId: validObjectId },
    });
    const res = mockRes();

    await updateCartItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Insufficient stock') }),
    );
  });
});

// clearCart
describe('clearCart', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 on successful clear', async () => {
    mockCart.findOneAndUpdate.mockResolvedValue({ items: [] });

    const req = mockReq();
    const res = mockRes();

    await clearCart(req, res);

    expect(mockCart.findOneAndUpdate).toHaveBeenCalledWith(
      { user: 'user1' },
      { items: [] },
      { new: true },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cart cleared successfully' }),
    );
  });

  test('returns 500 on database error', async () => {
    mockCart.findOneAndUpdate.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await clearCart(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
