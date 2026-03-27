import axiosInstance from '../../src/services/axiosInstance';
import {
  getWishlistService,
  addToWishlistService,
  removeFromWishlistService,
  clearWishlistService,
} from '../../src/services/whishlistService';

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

// getWishlistService tests
describe('getWishlistService', () => {
  test('calls GET /api/wishlist', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, wishlist: { products: [] } } });

    const result = await getWishlistService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/wishlist');
    expect(result.success).toBe(true);
  });
});

// addToWishlistService tests
describe('addToWishlistService', () => {
  test('calls POST /api/wishlist with productId', async () => {
    axiosInstance.post.mockResolvedValue({ data: { success: true } });

    await addToWishlistService('prod1');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/wishlist', { productId: 'prod1' });
  });

  test('throws on error', async () => {
    axiosInstance.post.mockRejectedValue(new Error('Already in wishlist'));
    await expect(addToWishlistService('prod1')).rejects.toThrow('Already in wishlist');
  });
});

// removeFromWishlistService tests
describe('removeFromWishlistService', () => {
  test('calls DELETE /api/wishlist/:productId', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    await removeFromWishlistService('prod1');

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/wishlist/prod1');
  });
});

// clearWishlistService tests
describe('clearWishlistService', () => {
  test('calls DELETE /api/wishlist', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    await clearWishlistService();

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/wishlist');
  });
});
