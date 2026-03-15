import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../../src/context/cartContext';
import * as cartService from '../../src/services/cartService';

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

jest.mock('../../src/services/cartService');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

// CartProvider depends on useAuth — mock the authContext module
const mockAuth = { authenticate: true, user: { fullName: 'Daniel' } };
jest.mock('../../src/context/authContext', () => ({
  useAuth: () => ({ auth: mockAuth }),
}));

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

beforeEach(() => {
  jest.clearAllMocks();
  // Default: fetchCart on mount succeeds with empty cart
  cartService.getCartService.mockResolvedValue({
    success: true,
    cart: { items: [], total: 0 },
  });
});

// Guard test must run before any other tests that use the wrapper
describe('useCart guard', () => {
  test('throws when used outside CartProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used inside CartProvider');

    spy.mockRestore();
  });
});

// Initial state test must run before any tests that call async functions, to ensure the initial loading state is correct
describe('initial state', () => {
  test('fetches cart on mount when authenticated', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(cartService.getCartService).toHaveBeenCalledTimes(1);
    expect(result.current.cart).toEqual({ items: [], total: 0 });
  });

  test('itemCount is 0 for empty cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.itemCount).toBe(0);
  });
});

// addItem tests
describe('addItem', () => {
  test('adds item and updates cart state', async () => {
    const updatedCart = {
      items: [{ product: 'p1', quantity: 2 }],
      total: 1000,
    };
    cartService.addToCartService.mockResolvedValue({
      success: true,
      cart: updatedCart,
    });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let response;
    await act(async () => {
      response = await result.current.addItem('p1', 2);
    });

    expect(response.success).toBe(true);
    expect(result.current.cart).toEqual(updatedCart);
    expect(cartService.addToCartService).toHaveBeenCalledWith('p1', 2, null);
  });

  test('passes variantSku when provided', async () => {
    cartService.addToCartService.mockResolvedValue({ success: true, cart: { items: [] } });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addItem('p1', 1, 'RED-L');
    });

    expect(cartService.addToCartService).toHaveBeenCalledWith('p1', 1, 'RED-L');
  });

  test('throws on API error', async () => {
    const error = new Error('Stock exceeded');
    error.response = { data: { message: 'Quantity exceeds stock' } };
    cartService.addToCartService.mockRejectedValue(error);

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.addItem('p1', 99);
      }),
    ).rejects.toEqual({ message: 'Quantity exceeds stock' });
  });
});

// updateItem tests
describe('updateItem', () => {
  test('updates item quantity', async () => {
    const updatedCart = { items: [{ product: 'p1', quantity: 5 }], total: 2500 };
    cartService.updateCartItemService.mockResolvedValue({
      success: true,
      cart: updatedCart,
    });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateItem('p1', 5);
    });

    expect(cartService.updateCartItemService).toHaveBeenCalledWith('p1', 5);
    expect(result.current.cart).toEqual(updatedCart);
  });

  test('does nothing when quantity < 1', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateItem('p1', 0);
    });

    expect(cartService.updateCartItemService).not.toHaveBeenCalled();
  });
});

//  removeItem tests
describe('removeItem', () => {
  test('removes item and updates cart', async () => {
    cartService.removeCartItemService.mockResolvedValue({
      success: true,
      cart: { items: [], total: 0 },
    });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeItem('p1');
    });

    expect(cartService.removeCartItemService).toHaveBeenCalledWith('p1');
    expect(result.current.cart.items).toEqual([]);
  });
});

// clearCart tests
describe('clearCart', () => {
  test('clears all items', async () => {
    cartService.clearCartService.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useCart(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.clearCart();
    });

    expect(cartService.clearCartService).toHaveBeenCalled();
    expect(result.current.cart.items).toEqual([]);
  });
});

// itemCount tests
describe('itemCount', () => {
  test('computes total quantity across items', async () => {
    cartService.getCartService.mockResolvedValue({
      success: true,
      cart: {
        items: [
          { product: 'p1', quantity: 3 },
          { product: 'p2', quantity: 2 },
        ],
        total: 2500,
      },
    });

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.itemCount).toBe(5);
  });
});
