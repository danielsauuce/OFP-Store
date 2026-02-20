import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/authContext';
import {
  getCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
} from '../services/cartService';

const SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 50;

const Cart = () => {
  const { auth } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (auth.authenticate) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [auth.authenticate]);

  const fetchCart = async () => {
    try {
      const data = await getCartService();
      if (data?.success) {
        setCart(data.cart);
      }
    } catch (error) {
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdatingId(productId);
    try {
      const data = await updateCartItemService(productId, newQuantity);
      if (data?.success) {
        setCart(data.cart);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    setUpdatingId(productId);
    try {
      const data = await removeCartItemService(productId);
      if (data?.success) {
        setCart(data.cart);
        toast.success('Item removed from cart');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      const data = await clearCartService();
      if (data?.success) {
        setCart({ ...cart, items: [] });
        toast.success('Cart cleared');
      }
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  };

  // Helper to get image URL from populated product or snapshot
  const getItemImage = (item) => {
    return item.product?.primaryImage?.secureUrl || item.imageSnapshot || '';
  };

  const getItemName = (item) => {
    return item.product?.name || item.nameSnapshot || 'Product';
  };

  const getItemId = (item) => {
    return typeof item.product === 'object' ? item.product._id : item.product;
  };

  const subtotal = cart?.total || 0;
  const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!auth.authenticate) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 bg-background">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Sign in to view your cart
          </h2>
          <p className="text-muted-foreground mb-8">
            You need to be logged in to add items and view your cart.
          </p>
          <Link
            to="/auth"
            className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 bg-background">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added any items yet.</p>
          <Link
            to="/shop"
            className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-background text-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-serif font-bold">Shopping Cart</h1>
          <button
            onClick={handleClearCart}
            className="text-sm text-destructive hover:text-destructive/80 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => {
              const productId = getItemId(item);
              const isUpdating = updatingId === productId;

              return (
                <div
                  key={productId}
                  className={`bg-card rounded-lg border border-border overflow-hidden shadow-card transition-opacity ${
                    isUpdating ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="p-6 flex gap-6">
                    {/* Image */}
                    <div className="w-32 h-32 shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={getItemImage(item)}
                        alt={getItemName(item)}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <Link
                          to={`/product/${productId}`}
                          className="font-semibold text-lg text-foreground hover:text-primary transition-colors"
                        >
                          {getItemName(item)}
                        </Link>
                        {item.variantSku && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Variant: {item.variantSku}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity */}
                        <div className="flex items-center border border-border rounded-md">
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.quantity - 1)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.quantity + 1)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Price + Remove */}
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-lg text-foreground">
                            £{(item.priceSnapshot * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(productId)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border border-border shadow-card p-6 space-y-4 sticky top-20">
              <h3 className="text-xl font-semibold text-foreground">Order Summary</h3>

              <div className="border-t border-border" />

              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `£${shipping.toFixed(2)}`}</span>
                </div>

                <div className="border-t border-border" />

                <div className="flex justify-between text-xl font-bold text-foreground">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary-dark transition-colors"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/shop"
                className="block w-full text-center px-6 py-3 border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
