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

/**
 * Safely resolves category, primaryImage, and images references on lean product objects.
 *
 * Problem: Some products in the DB were seeded with:
 *  - category as a string name (e.g. "Decor") instead of an ObjectId ref
 *  - image field (string ObjectId) instead of the schema's primaryImage field
 *  - primaryImage as a raw ObjectId string that didn't get populated
 *
 * This function batch-fetches all needed Media and Category docs in 2 queries max,
 * then patches each product in-place.
 */
const resolveProductRefs = async (products) => {
  if (!products || products.length === 0) return;

  const mediaIdSet = new Set();
  const categoryIdSet = new Set();
  const categoryNameSet = new Set();

  for (const product of products) {
    // --- Collect media IDs that need resolving ---
    // primaryImage: could be ObjectId, string ObjectId, or already populated
    const primaryVal = product.primaryImage;
    if (primaryVal && typeof primaryVal !== 'object') {
      const id = primaryVal.toString();
      if (mongoose.Types.ObjectId.isValid(id)) mediaIdSet.add(id);
    }
    // Stray 'image' field (string ObjectId from legacy seeding)
    if (
      product.image &&
      typeof product.image === 'string' &&
      mongoose.Types.ObjectId.isValid(product.image)
    ) {
      mediaIdSet.add(product.image);
    }
    // images array: collect any that are raw IDs
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && typeof img !== 'object') {
          const id = img.toString();
          if (mongoose.Types.ObjectId.isValid(id)) mediaIdSet.add(id);
        }
      }
    }

    // --- Collect category refs that need resolving ---
    const catVal = product.category;
    if (catVal && typeof catVal !== 'object') {
      const catStr = catVal.toString();
      if (mongoose.Types.ObjectId.isValid(catStr)) {
        categoryIdSet.add(catStr);
      } else {
        // It's a string name like "Decor"
        categoryNameSet.add(catStr);
      }
    }
  }

  // Batch-fetch Media docs
  const mediaMap = new Map();
  if (mediaIdSet.size > 0) {
    try {
      const mediaDocs = await Media.find({ _id: { $in: Array.from(mediaIdSet) } })
        .select('secureUrl publicId url')
        .lean();
      for (const doc of mediaDocs) {
        mediaMap.set(doc._id.toString(), doc);
      }
    } catch (err) {
      console.error('resolveProductRefs media fetch warning:', err.message);
    }
  }

  // Batch-fetch Category docs (by ID and by name)
  const categoryMap = new Map(); // key = ObjectId string or lowercase name → category doc
  const categoryQueries = [];
  if (categoryIdSet.size > 0) {
    categoryQueries.push({ _id: { $in: Array.from(categoryIdSet) } });
  }
  if (categoryNameSet.size > 0) {
    categoryQueries.push({ name: { $in: Array.from(categoryNameSet) } });
  }
  if (categoryQueries.length > 0) {
    try {
      const catDocs = await Category.find(
        categoryQueries.length === 1 ? categoryQueries[0] : { $or: categoryQueries },
      )
        .select('name slug description')
        .lean();
      for (const doc of catDocs) {
        categoryMap.set(doc._id.toString(), doc);
        categoryMap.set(doc.name, doc); // also map by name for legacy lookups
      }
    } catch (err) {
      console.error('resolveProductRefs category fetch warning:', err.message);
    }
  }

  // Patch each product in-place
  for (const product of products) {
    // --- Resolve primaryImage ---
    const primaryVal = product.primaryImage;
    if (primaryVal && typeof primaryVal === 'object' && primaryVal.secureUrl) {
      // Already populated, keep it
    } else {
      // Try primaryImage ID, then fall back to stray 'image' field
      const primaryId = primaryVal && typeof primaryVal !== 'object' ? primaryVal.toString() : null;
      const imageId = product.image && typeof product.image === 'string' ? product.image : null;
      const resolvedId = primaryId && mediaMap.has(primaryId) ? primaryId : imageId;
      if (resolvedId && mediaMap.has(resolvedId)) {
        product.primaryImage = mediaMap.get(resolvedId);
      }
    }

    // --- Resolve images array ---
    if (Array.isArray(product.images)) {
      product.images = product.images.map((img) => {
        if (img && typeof img === 'object' && img.secureUrl) return img;
        const id = img ? img.toString() : null;
        return id && mediaMap.has(id) ? mediaMap.get(id) : img;
      });
    }

    // --- Resolve category ---
    const catVal = product.category;
    if (catVal && typeof catVal === 'object' && catVal.name) {
      // Already populated, keep it
    } else if (catVal) {
      const catStr = catVal.toString();
      const resolved = categoryMap.get(catStr);
      if (resolved) {
        product.category = resolved;
      } else {
        // Keep the string name as a fallback object so frontend doesn't break
        product.category = { name: catStr, slug: catStr.toLowerCase().replace(/\s+/g, '-') };
      }
    }
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 12, 1);
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    if (req.query.category) {
      // Try to find the category by name first
      const categoryDoc = await Category.findOne({
        name: { $regex: `^${req.query.category}$`, $options: 'i' },
      });

      if (!categoryDoc) {
        return res.status(200).json({
          success: true,
          data: {
            products: [],
            pagination: { total: 0, page, pages: 0, limit },
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

    // Fetch WITHOUT populate to avoid CastError on string category/image values
    const [rawProducts, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    // Resolve references manually so string values don't crash populate
    await resolveProductRefs(rawProducts);

    res.status(200).json({
      success: true,
      data: {
        products: rawProducts,
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

    // Fetch without populate to avoid CastError on string category/image values
    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Resolve all refs (category, primaryImage, images) safely
    await resolveProductRefs([product]);

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
