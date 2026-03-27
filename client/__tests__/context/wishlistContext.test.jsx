import { renderHook, act, waitFor } from '@testing-library/react';
import { WishlistProvider, useWishlist } from '../../src/context/wishlistContext';
import * as wishlistService from '../../src/services/whishlistService';

// Mock axiosInstance to prevent import.meta.env parse error
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

jest.mock('../../src/services/whishlistService');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

// WishlistProvider depends on useAuth
const mockAuth = { authenticate: true, user: { fullName: 'Daniel' } };
jest.mock('../../src/context/authContext', () => ({
  useAuth: () => ({ auth: mockAuth }),
}));

const wrapper = ({ children }) => <WishlistProvider>{children}</WishlistProvider>;

beforeEach(() => {
  jest.clearAllMocks();
  // Default: fetchWishlist on mount succeeds with empty wishlist
  wishlistService.getWishlistService.mockResolvedValue({
    success: true,
    wishlist: { products: [], count: 0 },
  });
});

// Guard test must run before any other tests that use the wrapper
describe('useWishlist guard', () => {
  test('throws when used outside WishlistProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useWishlist());
    }).toThrow('useWishlist must be used inside WishlistProvider');

    spy.mockRestore();
  });
});

// Initial state test must run before any tests that call async functions, to ensure the initial loading state is correct
describe('initial state', () => {
  test('fetches wishlist on mount when authenticated', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(wishlistService.getWishlistService).toHaveBeenCalledTimes(1);
    expect(result.current.wishlist).toEqual({ products: [], count: 0 });
  });

  test('itemCount is 0 for empty wishlist', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.itemCount).toBe(0);
  });
});

// addToWishlist tests
describe('addToWishlist', () => {
  test('adds product and updates state', async () => {
    const updatedWishlist = { products: [{ _id: 'p1', name: 'Sofa' }], count: 1 };
    wishlistService.addToWishlistService.mockResolvedValue({
      success: true,
      wishlist: updatedWishlist,
    });

    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.addToWishlist('p1');
    });

    expect(response.success).toBe(true);
    expect(result.current.wishlist).toEqual(updatedWishlist);
  });

  test('returns failure on error', async () => {
    const error = new Error('Already in wishlist');
    error.response = { data: { message: 'Product already in wishlist' } };
    wishlistService.addToWishlistService.mockRejectedValue(error);

    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.addToWishlist('p1');
    });

    expect(response.success).toBe(false);
    expect(response.message).toBe('Product already in wishlist');
  });
});

// removeFromWishlist tests
describe('removeFromWishlist', () => {
  test('removes product and updates state', async () => {
    wishlistService.removeFromWishlistService.mockResolvedValue({
      success: true,
      wishlist: { products: [], count: 0 },
    });

    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.removeFromWishlist('p1');
    });

    expect(response.success).toBe(true);
    expect(result.current.wishlist.products).toEqual([]);
  });
});

// clearAll tests
describe('clearAll', () => {
  test('clears all wishlist items', async () => {
    wishlistService.clearWishlistService.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.clearAll();
    });

    expect(response.success).toBe(true);
    expect(result.current.wishlist.products).toEqual([]);
  });
});

// isInWishlist tests
describe('isInWishlist', () => {
  test('returns true when product is in wishlist (object form)', async () => {
    wishlistService.getWishlistService.mockResolvedValue({
      success: true,
      wishlist: {
        products: [
          { _id: 'p1', name: 'Sofa' },
          { _id: 'p2', name: 'Table' },
        ],
        count: 2,
      },
    });

    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isInWishlist('p1')).toBe(true);
    expect(result.current.isInWishlist('p3')).toBe(false);
  });

  test('returns true when product is in wishlist (string ID form)', async () => {
    wishlistService.getWishlistService.mockResolvedValue({
      success: true,
      wishlist: { products: ['p1', 'p2'], count: 2 },
    });

    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isInWishlist('p1')).toBe(true);
    expect(result.current.isInWishlist('p99')).toBe(false);
  });

  test('returns false when wishlist is empty', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isInWishlist('p1')).toBe(false);
  });
});

// itemCount tests
describe('itemCount', () => {
  test('uses count field when available', async () => {
    wishlistService.getWishlistService.mockResolvedValue({
      success: true,
      wishlist: { products: [{ _id: 'p1' }, { _id: 'p2' }], count: 2 },
    });

    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.itemCount).toBe(2);
  });

  test('falls back to products.length when count is missing', async () => {
    wishlistService.getWishlistService.mockResolvedValue({
      success: true,
      wishlist: { products: [{ _id: 'p1' }, { _id: 'p2' }, { _id: 'p3' }] },
    });

    const { result } = renderHook(() => useWishlist(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.itemCount).toBe(3);
  });
});
