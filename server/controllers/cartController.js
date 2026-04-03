import mongoose from 'mongoose';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import Media from '../models/media.js';
import logger from '../utils/logger.js';
import { addItem, updateItem } from '../utils/cartValidation.js';

// Helper: compute total from items (needed because .lean() strips virtuals)
const computeCartTotal = (items) => {
  return items.reduce((sum, item) => sum + (item.priceSnapshot || 0) * item.quantity, 0);
};

// Resolve an image URL from a populated primaryImage field or a raw ObjectId/string.
const resolveImageUrl = async (primaryImage) => {
  if (!primaryImage) return null;
  // Already populated as a Media doc
  if (typeof primaryImage === 'object' && (primaryImage.secureUrl || primaryImage.url)) {
    return primaryImage.secureUrl || primaryImage.url;
  }
  // Raw ObjectId — fetch the Media doc
  const id = primaryImage._id?.toString() || primaryImage.toString();
  if (mongoose.Types.ObjectId.isValid(id)) {
    const media = await Media.findById(id).select('secureUrl url').lean();
    return media?.secureUrl || media?.url || null;
  }
  // Legacy plain URL string stored directly
  if (typeof primaryImage === 'string' && primaryImage.startsWith('http')) {
    return primaryImage;
  }
  return null;
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.product',
        select: 'name slug primaryImage variants',
        populate: { path: 'primaryImage', select: 'secureUrl publicId url' },
      })
      .lean();

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
      return res.status(200).json({
        success: true,
        cart: { _id: cart._id, items: [], total: 0 },
      });
    }

    // Resolve a guaranteed image URL for every item from the backend.
    // If the stored imageSnapshot is missing/stale, derive it from the
    // populated product.primaryImage (or fetch the Media doc directly).
    // Also back-fill imageSnapshot in the DB so future requests are instant.
    const snapshotsToFix = []; // { productId, imageUrl }

    const resolvedItems = await Promise.all(
      cart.items.map(async (item) => {
        // 1. Try the populated product image (most authoritative source)
        let imageUrl = await resolveImageUrl(item.product?.primaryImage);

        // 2. Fall back to the stored snapshot if resolution failed
        if (!imageUrl && item.imageSnapshot) {
          imageUrl = item.imageSnapshot;
        }

        // 3. Queue a DB fix if the snapshot was missing or empty
        if (imageUrl && !item.imageSnapshot) {
          snapshotsToFix.push({
            productId: (item.product?._id || item.product).toString(),
            variantSku: item.variantSku || null,
            imageUrl,
          });
        }

        return { ...item, imageSnapshot: imageUrl || '' };
      }),
    );

    // Best-effort: patch stale imageSnapshots in the background
    if (snapshotsToFix.length > 0) {
      Cart.findOne({ user: userId })
        .then((cartDoc) => {
          if (!cartDoc) return;
          let dirty = false;
          for (const { productId, variantSku, imageUrl } of snapshotsToFix) {
            const itemDoc = cartDoc.items.find(
              (i) => i.product.toString() === productId && i.variantSku === variantSku,
            );
            if (itemDoc && !itemDoc.imageSnapshot) {
              itemDoc.imageSnapshot = imageUrl;
              dirty = true;
            }
          }
          if (dirty) cartDoc.save().catch(() => {});
        })
        .catch(() => {});
    }

    res.status(200).json({
      success: true,
      cart: {
        _id: cart._id,
        items: resolvedItems,
        total: computeCartTotal(resolvedItems),
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
      // Resolve the actual image URL for snapshot using the shared helper
      // handles ObjectId, already-populated Media doc, and legacy plain-string URLs
      const imageSnapshot = await resolveImageUrl(product.primaryImage);

      cart.items.push({
        product: productId,
        variantSku,
        quantity,
        priceSnapshot: itemPrice,
        nameSnapshot: product.name,
        imageSnapshot,
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
