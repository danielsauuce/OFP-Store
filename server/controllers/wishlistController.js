import Wishlist from '../models/wishlist.js';
import Product from '../models/product.js';
import logger from '../utils/logger.js';
import { addToWishlist } from '../utils/wishlist.js';

// Get current user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    let wishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: 'products',
        select: 'name slug primaryImage price compareAtPrice inStock variants',
        populate: {
          path: 'primaryImage',
          select: 'secureUrl publicId url',
        },
      })
      .lean();

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }

    res.status(200).json({
      success: true,
      wishlist: {
        _id: wishlist._id,
        products: wishlist.products,
        count: wishlist.products.length,
      },
    });
  } catch (error) {
    logger.error('Get wishlist error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
};

// Add product to wishlist
export const addProductToWishlist = async (req, res) => {
  try {
    const { error } = addToWishlist.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { productId } = req.body;
    const userId = req.user.id;

    // Check if product exists and is active
    const product = await Product.findById(productId).select('_id isActive');
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable',
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
    }

    // Check if already in wishlist
    const alreadyExists = wishlist.products.some((p) => p.toString() === productId);

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist',
      });
    }

    wishlist.products.push(productId);
    await wishlist.save();

    // Populate for response
    await wishlist.populate({
      path: 'products',
      select: 'name slug primaryImage price compareAtPrice inStock',
      populate: {
        path: 'primaryImage',
        select: 'secureUrl publicId',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: {
        _id: wishlist._id,
        products: wishlist.products,
        count: wishlist.products.length,
      },
    });
  } catch (error) {
    logger.error('Add to wishlist error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Failed to add product to wishlist' });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found',
      });
    }

    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);

    if (wishlist.products.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist',
      });
    }

    await wishlist.save();

    // Optional: repopulate if you want full product details in response
    await wishlist.populate({
      path: 'products',
      select: 'name slug primaryImage price compareAtPrice inStock',
      populate: { path: 'primaryImage', select: 'secureUrl publicId' },
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: {
        _id: wishlist._id,
        products: wishlist.products,
        count: wishlist.products.length,
      },
    });
  } catch (error) {
    logger.error('Remove from wishlist error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to remove product' });
  }
};

// Clear entire wishlist
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    await Wishlist.findOneAndUpdate({ user: userId }, { products: [] }, { new: true });

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully',
    });
  } catch (error) {
    logger.error('Clear wishlist error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to clear wishlist' });
  }
};
