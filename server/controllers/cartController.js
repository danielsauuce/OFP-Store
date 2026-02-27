import Cart from '../models/cart.js';
import Product from '../models/product.js';
import logger from '../utils/logger.js';
import { addItem, updateItem } from '../utils/cartValidation.js';

// Helper: compute total from items (needed because .lean() strips virtuals)
const computeCartTotal = (items) => {
  return items.reduce((sum, item) => sum + (item.priceSnapshot || 0) * item.quantity, 0);
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name slug primaryImage variants',
        populate: {
          path: 'primaryImage',
          select: 'secureUrl publicId url',
        },
      })
      .lean();

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
      return res.status(200).json({
        success: true,
        cart: {
          _id: cart._id,
          items: [],
          total: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        items: cart.items,
        total: computeCartTotal(cart.items),
      },
    });
  } catch (error) {
    logger.error('Get cart error', { error: error.message, userId: req?.user?.id });
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { error } = addItem.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }

    const { product: productId, variantSku, quantity = 1 } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or inactive' });
    }

    let itemPrice = product.price;
    let availableStock;
    let selectedVariant = null;

    if (product.variants?.length > 0) {
      if (!variantSku) {
        return res
          .status(400)
          .json({ success: false, message: 'Variant SKU required for this product' });
      }
      selectedVariant = product.variants.find((v) => v.sku === variantSku);
      if (!selectedVariant) {
        return res.status(404).json({ success: false, message: 'Selected variant not found' });
      }
      availableStock = selectedVariant.stockQuantity;
      itemPrice = selectedVariant.price || product.price;
    } else {
      availableStock = product.stockQuantity;
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.variantSku === variantSku,
    );

    if (existingItemIndex !== -1) {
      // Re-validate total quantity against available stock
      const newTotalQty = cart.items[existingItemIndex].quantity + quantity;
      if (newTotalQty > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${availableStock} available (you already have ${cart.items[existingItemIndex].quantity} in cart)`,
        });
      }
      cart.items[existingItemIndex].quantity = newTotalQty;
    } else {
      if (quantity > availableStock) {
        return res.status(400).json({ success: false, message: 'Insufficient stock' });
      }
      cart.items.push({
        product: productId,
        variantSku,
        quantity,
        priceSnapshot: itemPrice,
        nameSnapshot: product.name,
        imageSnapshot: product.primaryImage?.toString() || null,
      });
    }

    await cart.save();

    // Repopulate for response
    await cart.populate({
      path: 'items.product',
      select: 'name slug primaryImage',
      populate: { path: 'primaryImage', select: 'secureUrl publicId' },
    });

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: {
        _id: cart._id,
        items: cart.items,
        total: cart.total,
      },
    });
  } catch (error) {
    logger.error('Add to cart error', { error: error.message, userId: req?.user?.id });
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { error } = updateItem.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { quantity } = req.body;
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    // Validate stock availability before updating quantity
    const cartItem = cart.items[itemIndex];
    const product = await Product.findById(productId).lean();

    if (product) {
      let availableStock;
      if (cartItem.variantSku && product.variants?.length) {
        const variant = product.variants.find((v) => v.sku === cartItem.variantSku);
        availableStock = variant?.stockQuantity ?? 0;
      } else {
        availableStock = product.stockQuantity ?? 0;
      }

      if (quantity > availableStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${availableStock} available`,
        });
      }
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name slug primaryImage',
      populate: { path: 'primaryImage', select: 'secureUrl publicId' },
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      cart: {
        _id: cart._id,
        items: cart.items,
        total: cart.total,
      },
    });
  } catch (error) {
    logger.error('Update cart item error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update cart item' });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Filter by both product AND variantSku for proper variant distinction
    const variantSku = req.query.variantSku || null;
    cart.items = cart.items.filter((item) => {
      const productMatch = item.product.toString() === productId;
      if (!productMatch) return true; // keep items that don't match this product
      // If variantSku specified, only remove the matching variant
      if (variantSku) return item.variantSku !== variantSku;
      // If no variantSku specified, remove all items with this productId
      return false;
    });

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name slug primaryImage',
      populate: { path: 'primaryImage', select: 'secureUrl publicId' },
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: {
        _id: cart._id,
        items: cart.items,
        total: cart.total,
      },
    });
  } catch (error) {
    logger.error('Remove cart item error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
};

export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await Cart.findOneAndUpdate({ user: userId }, { items: [] }, { new: true });

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    logger.error('Clear cart error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};
