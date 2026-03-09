import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './authContext';
import {
  getWishlistService,
  addToWishlistService,
  removeFromWishlistService,
  clearWishlistService,
} from '../services/whishlistService';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { auth } = useAuth();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.authenticate) {
      fetchWishlist();
    } else {
      setWishlist(null);
    }
  }, [auth.authenticate]);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWishlistService();
      if (data?.success) {
        setWishlist(data.wishlist);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(async (productId) => {
    try {
      const data = await addToWishlistService(productId);
      if (data?.success) {
        setWishlist(data.wishlist);
        toast.success('Added to wishlist');
        return { success: true };
      }
      return { success: false, message: data?.message };
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to add to wishlist';
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId) => {
    try {
      const data = await removeFromWishlistService(productId);
      if (data?.success) {
        setWishlist(data.wishlist);
        toast.success('Removed from wishlist');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const data = await clearWishlistService();
      if (data?.success) {
        setWishlist((prev) => (prev ? { ...prev, products: [], count: 0 } : null));
        toast.success('Wishlist cleared');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to clear wishlist');
    }
  }, []);

  const isInWishlist = useCallback(
    (productId) => {
      if (!wishlist?.products?.length) return false;
      return wishlist.products.some((p) => (typeof p === 'object' ? p._id : p) === productId);
    },
    [wishlist],
  );

  const itemCount = useMemo(() => wishlist?.count || wishlist?.products?.length || 0, [wishlist]);

  const value = useMemo(
    () => ({
      wishlist,
      loading,
      itemCount,
      fetchWishlist,
      addToWishlist,
      removeFromWishlist,
      clearAll,
      isInWishlist,
    }),
    [
      wishlist,
      loading,
      itemCount,
      fetchWishlist,
      addToWishlist,
      removeFromWishlist,
      clearAll,
      isInWishlist,
    ],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === null) {
    throw new Error('useWishlist must be used inside WishlistProvider');
  }
  return context;
}
