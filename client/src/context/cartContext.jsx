import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './authContext';
import {
  getCartService,
  addToCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
} from '../services/cartService';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { auth } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch cart when user authenticates
  useEffect(() => {
    if (auth.authenticate) {
      fetchCart();
    } else {
      // Clear cart state when logged out
      setCart(null);
    }
  }, [auth.authenticate]);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCartService();
      if (data?.success) {
        setCart(data.cart);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (productId, quantity = 1, variantSku = null) => {
    try {
      const data = await addToCartService(productId, quantity, variantSku);
      if (data?.success) {
        setCart(data.cart);
        return { success: true };
      }
      return { success: false, message: data?.message };
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to add to cart';
      throw new Error(message);
    }
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    if (quantity < 1) return;
    try {
      const data = await updateCartItemService(productId, quantity);
      if (data?.success) {
        setCart(data.cart);
        return { success: true };
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update quantity';
      toast.error(message);
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    try {
      const data = await removeCartItemService(productId);
      if (data?.success) {
        setCart(data.cart);
        toast.success('Item removed from cart');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      const data = await clearCartService();
      if (data?.success) {
        setCart((prev) => (prev ? { ...prev, items: [], total: 0 } : null));
        toast.success('Cart cleared');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  }, []);

  // Computed values
  const itemCount = useMemo(() => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount,
      fetchCart,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      setCart,
    }),
    [cart, loading, itemCount, fetchCart, addItem, updateItem, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
