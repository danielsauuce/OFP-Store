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
