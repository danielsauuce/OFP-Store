import Product from '../models/product.js';
import Category from '../models/category.js';
import Media from '../models/media.js';
import logger from '../utils/logger.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';
import { deleteMediaFromCloudinary } from '../config/cloudinary.js';
import {
  createProduct as createProductValidation,
  updateProduct as updateProductValidation,
} from '../utils/productValidation.js';

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category, // expected to be a slug
      minPrice,
      maxPrice,
      sort,
      inStock,
      isFeatured,
    } = req.query;

    const query = { isActive: true };

    // ===== Category filter =====
    if (category) {
      // Look up category by slug first
      const cat = await Category.findOne({ slug: category.toLowerCase().trim() });
      if (!cat) {
        // No category matches, return empty result instead of crashing
        return res.status(200).json({
          success: true,
          data: {
            products: [],
            pagination: { total: 0, page: Number(page), pages: 0, limit: Number(limit) },
          },
        });
      }
      query.category = cat._id; // safe ObjectId assignment
    }

    // ===== Text search =====
    if (search) {
      query.$text = { $search: search.trim() };
    }

    // ===== Price range filter =====
    if (minPrice || maxPrice) {
      const priceQuery = {};
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);
      query.$or = [{ price: priceQuery }, { 'variants.price': priceQuery }];
    }

    // ===== Stock filter =====
    if (inStock === 'true') {
      query.inStock = true;
    }

    // ===== Featured filter =====
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    // ===== Sorting =====
    let sortOption = { createdAt: -1 };
    if (sort) {
      const direction = sort.startsWith('-') ? -1 : 1;
      const field = sort.replace(/^-/, '');
      sortOption = { [field]: direction };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // ===== Fetch products =====
    const products = await Product.find(query)
      .populate('primaryImage', 'secureUrl publicId url')
      .populate('images', 'secureUrl publicId url')
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      },
    });
  } catch (err) {
    logger.error('Get all products error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('primaryImage', 'secureUrl publicId url')
      .populate('images', 'secureUrl publicId url')
      .populate('category', 'name slug description')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    logger.error('Get product by ID error', { id: req.params.id, error: err.message });
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { error } = createProductValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const product = await Product.create(req.body);

    // Mark media as used
    if (product.primaryImage) {
      await Media.findByIdAndUpdate(product.primaryImage, {
        $addToSet: { usedBy: { modelType: 'Product', modelId: product._id } },
      });
    }
    if (product.images?.length) {
      await Media.updateMany(
        { _id: { $in: product.images } },
        { $addToSet: { usedBy: { modelType: 'Product', modelId: product._id } } },
      );
    }

    await invalidateCache('cache:/api/product*');
    await invalidateCache('cache:/api/products*');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (err) {
    logger.error('Create product error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { error } = updateProductValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const oldPrimary = product.primaryImage?.toString();
    const oldImages = product.images?.map((id) => id.toString()) || [];

    // Apply updates
    Object.assign(product, req.body);
    await product.save();

    const newPrimary = product.primaryImage?.toString();
    const newImages = product.images?.map((id) => id.toString()) || [];

    // Handle removed media
    if (oldPrimary && oldPrimary !== newPrimary) {
      await Media.findByIdAndUpdate(oldPrimary, {
        $pull: { usedBy: { modelId: product._id } },
      });
    }
    const removed = oldImages.filter((id) => !newImages.includes(id));
    if (removed.length) {
      await Media.updateMany(
        { _id: { $in: removed } },
        { $pull: { usedBy: { modelId: product._id } } },
      );
    }

    // Handle added media
    if (newPrimary && newPrimary !== oldPrimary) {
      await Media.findByIdAndUpdate(newPrimary, {
        $addToSet: { usedBy: { modelType: 'Product', modelId: product._id } },
      });
    }
    const added = newImages.filter((id) => !oldImages.includes(id));
    if (added.length) {
      await Media.updateMany(
        { _id: { $in: added } },
        { $addToSet: { usedBy: { modelType: 'Product', modelId: product._id } } },
      );
    }

    await invalidateCache('cache:/api/product*');
    await invalidateCache(`cache:/api/product/${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (err) {
    logger.error('Update product error', { id: req.params.id, error: err.message });
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const mediaIds = [product.primaryImage, ...(product.images || [])].filter(Boolean);

    if (mediaIds.length) {
      await Media.updateMany(
        { _id: { $in: mediaIds } },
        { $pull: { usedBy: { modelId: product._id } } },
      );

      const unused = await Media.find({
        _id: { $in: mediaIds },
        usedBy: { $size: 0 },
      });

      for (const m of unused) {
        try {
          await deleteMediaFromCloudinary(m.publicId);
          await m.deleteOne();
        } catch (e) {
          logger.warn('Failed to delete unused media', { mediaId: m._id });
        }
      }
    }

    await product.deleteOne();

    await invalidateCache('cache:/api/product*');
    await invalidateCache(`cache:/api/product/${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err) {
    logger.error('Delete product error', { id: req.params.id, error: err.message });
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
