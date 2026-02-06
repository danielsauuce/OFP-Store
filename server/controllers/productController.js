import mongoose from 'mongoose';
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
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    if (req.query.category) {
      const categoryDoc = await Category.findOne({
        name: { $regex: `^${req.query.category}$`, $options: 'i' },
      });

      if (!categoryDoc) {
        return res.status(200).json({
          success: true,
          data: {
            products: [],
            pagination: {
              total: 0,
              page,
              pages: 0,
              limit,
            },
          },
        });
      }

      query.category = categoryDoc._id;
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('primaryImage')
        .populate('images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    console.error('getAllProducts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Validate category is a valid ObjectId before populating
    if (product.category && mongoose.Types.ObjectId.isValid(product.category)) {
      try {
        const populatedProduct = await Product.findById(id)
          .populate('primaryImage', 'secureUrl publicId url')
          .populate('images', 'secureUrl publicId url')
          .populate('category', 'name slug description')
          .lean();

        return res.status(200).json({
          success: true,
          product: populatedProduct,
        });
      } catch (populateError) {
        logger.warn('Failed to populate product references', {
          id,
          error: populateError.message,
        });
        // Return product without populated fields
      }
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (err) {
    logger.error('Get product by ID error', {
      id: req.params.id,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    // Log incoming request for debugging
    logger.info('Creating product', {
      bodyKeys: Object.keys(req.body),
      hasName: !!req.body.name,
      hasCategory: !!req.body.category,
    });

    // Validate request body
    const { error } = createProductValidation.validate(req.body, { abortEarly: false });
    if (error) {
      logger.warn('Product validation failed', {
        errors: error.details.map((d) => d.message),
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    // Validate category exists and is a valid ObjectId
    if (req.body.category) {
      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        logger.warn('Invalid category ID format', { category: req.body.category });
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format',
        });
      }

      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        logger.warn('Category not found', { categoryId: req.body.category });
        return res.status(400).json({
          success: false,
          message: 'Category not found',
        });
      }
    }

    // Validate primaryImage exists
    if (req.body.primaryImage) {
      if (!mongoose.Types.ObjectId.isValid(req.body.primaryImage)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid primary image ID format',
        });
      }

      const imageExists = await Media.findById(req.body.primaryImage);
      if (!imageExists) {
        return res.status(400).json({
          success: false,
          message: 'Primary image not found',
        });
      }
    }

    // Validate additional images if provided
    if (req.body.images && req.body.images.length > 0) {
      const invalidImages = req.body.images.filter((id) => !mongoose.Types.ObjectId.isValid(id));

      if (invalidImages.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image IDs in images array',
        });
      }

      const imageCount = await Media.countDocuments({
        _id: { $in: req.body.images },
      });

      if (imageCount !== req.body.images.length) {
        return res.status(400).json({
          success: false,
          message: 'Some images not found',
        });
      }
    }

    // Create the product
    const product = await Product.create(req.body);
    logger.info('Product created successfully', { productId: product._id });

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

    // Invalidate cache
    await invalidateCache('cache:/api/product*');
    await invalidateCache('cache:/api/products*');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (err) {
    logger.error('Create product error', {
      error: err.message,
      stack: err.stack,
      body: req.body,
    });

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this slug already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
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

    // Validate category if being updated
    if (req.body.category && req.body.category.toString() !== product.category.toString()) {
      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID format',
        });
      }

      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found',
        });
      }
    }

    // Validate primaryImage if being updated
    if (
      req.body.primaryImage &&
      req.body.primaryImage.toString() !== product.primaryImage?.toString()
    ) {
      if (!mongoose.Types.ObjectId.isValid(req.body.primaryImage)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid primary image ID format',
        });
      }

      const imageExists = await Media.findById(req.body.primaryImage);
      if (!imageExists) {
        return res.status(400).json({
          success: false,
          message: 'Primary image not found',
        });
      }
    }

    // Validate images array if being updated
    if (req.body.images && req.body.images.length > 0) {
      const invalidImages = req.body.images.filter((id) => !mongoose.Types.ObjectId.isValid(id));

      if (invalidImages.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image IDs in images array',
        });
      }

      const imageCount = await Media.countDocuments({
        _id: { $in: req.body.images },
      });

      if (imageCount !== req.body.images.length) {
        return res.status(400).json({
          success: false,
          message: 'Some images not found',
        });
      }
    }

    const oldPrimary = product.primaryImage?.toString();
    const oldImages = product.images?.map((id) => id.toString()) || [];

    // Apply updates
    Object.assign(product, req.body);
    await product.save();

    const newPrimary = product.primaryImage?.toString();
    const newImages = product.images?.map((id) => id.toString()) || [];

    // Handle removed media (only if Media model has usedBy field)
    if (oldPrimary && oldPrimary !== newPrimary) {
      await Media.findByIdAndUpdate(oldPrimary, {
        $pull: { usedBy: { modelId: product._id } },
      }).catch((err) => {
        logger.warn('Failed to update old primary image usedBy', { error: err.message });
      });
    }

    const removed = oldImages.filter((id) => !newImages.includes(id));
    if (removed.length) {
      await Media.updateMany(
        { _id: { $in: removed } },
        { $pull: { usedBy: { modelId: product._id } } },
      ).catch((err) => {
        logger.warn('Failed to update removed images usedBy', { error: err.message });
      });
    }

    // Handle added media
    if (newPrimary && newPrimary !== oldPrimary) {
      await Media.findByIdAndUpdate(newPrimary, {
        $addToSet: { usedBy: { modelType: 'Product', modelId: product._id } },
      }).catch((err) => {
        logger.warn('Failed to update new primary image usedBy', { error: err.message });
      });
    }

    const added = newImages.filter((id) => !oldImages.includes(id));
    if (added.length) {
      await Media.updateMany(
        { _id: { $in: added } },
        { $addToSet: { usedBy: { modelType: 'Product', modelId: product._id } } },
      ).catch((err) => {
        logger.warn('Failed to update added images usedBy', { error: err.message });
      });
    }

    await invalidateCache('cache:/api/product*');
    await invalidateCache(`cache:/api/product/${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (err) {
    logger.error('Update product error', {
      id: req.params.id,
      error: err.message,
      stack: err.stack,
    });
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

    // Update media usedBy references (if Media model has usedBy field)
    if (mediaIds.length) {
      await Media.updateMany(
        { _id: { $in: mediaIds } },
        { $pull: { usedBy: { modelId: product._id } } },
      ).catch((err) => {
        logger.warn('Failed to update media usedBy references', { error: err.message });
      });

      // Find and delete unused media (if Media model has usedBy field)
      const unused = await Media.find({
        _id: { $in: mediaIds },
        usedBy: { $size: 0 },
      }).catch((err) => {
        logger.warn('Failed to find unused media', { error: err.message });
        return [];
      });

      for (const m of unused) {
        try {
          await deleteMediaFromCloudinary(m.publicId);
          await m.deleteOne();
          logger.info('Deleted unused media', { mediaId: m._id, publicId: m.publicId });
        } catch (e) {
          logger.warn('Failed to delete unused media', { mediaId: m._id, error: e.message });
        }
      }
    }

    await product.deleteOne();
    logger.info('Product deleted successfully', { productId: req.params.id });

    await invalidateCache('cache:/api/product*');
    await invalidateCache(`cache:/api/product/${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err) {
    logger.error('Delete product error', {
      id: req.params.id,
      error: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
