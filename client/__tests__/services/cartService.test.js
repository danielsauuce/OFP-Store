import axiosInstance from '../../src/services/axiosInstance';
import {
  getCartService,
  addToCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
} from '../../src/services/cartService';

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

// getCartService tests
describe('getCartService', () => {
  test('calls GET /api/cart and returns cart data', async () => {
    const mockCart = { success: true, cart: { items: [{ product: 'p1', quantity: 2 }] } };
    axiosInstance.get.mockResolvedValue({ data: mockCart });

    const result = await getCartService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/cart');
    expect(result.cart.items).toHaveLength(1);
  });
});

// addToCartService tests
describe('addToCartService', () => {
  test('calls POST /api/cart/items with product and quantity', async () => {
    const mockResponse = { success: true, message: 'Added to cart' };
    axiosInstance.post.mockResolvedValue({ data: mockResponse });

    const result = await addToCartService('prod1', 3);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/cart/items', {
      product: 'prod1',
      quantity: 3,
    });
    expect(result.success).toBe(true);
  });

  test('includes variantSku when provided', async () => {
    axiosInstance.post.mockResolvedValue({ data: { success: true } });

    await addToCartService('prod1', 1, 'RED-L');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/cart/items', {
      product: 'prod1',
      quantity: 1,
      variantSku: 'RED-L',
    });
  });

  test('uses default quantity of 1', async () => {
    axiosInstance.post.mockResolvedValue({ data: { success: true } });

    await addToCartService('prod1');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/cart/items', {
      product: 'prod1',
      quantity: 1,
    });
  });

  test('throws on API error', async () => {
    axiosInstance.post.mockRejectedValue(new Error('Stock exceeded'));

    await expect(addToCartService('prod1', 99)).rejects.toThrow('Stock exceeded');
  });
});

// updateCartItemService tests
describe('updateCartItemService', () => {
  test('calls PUT /api/cart/items/:productId with quantity', async () => {
    axiosInstance.put.mockResolvedValue({ data: { success: true } });

    await updateCartItemService('prod1', 5);

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/cart/items/prod1', { quantity: 5 });
  });
});

// removeCartItemService tests
describe('removeCartItemService', () => {
  test('calls DELETE /api/cart/items/:productId', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    await removeCartItemService('prod1');

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/cart/items/prod1');
  });
});

// clearCartService tests
describe('clearCartService', () => {
  test('calls DELETE /api/cart', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true, message: 'Cart cleared' } });

    const result = await clearCartService();

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/cart');
    expect(result.success).toBe(true);
  });
});
