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

const resolveProductRefs = async (products) => {
  if (!products || products.length === 0) return;

  const mediaIdSet = new Set();
  const categoryIdSet = new Set();
  const categoryNameSet = new Set();

  for (const product of products) {
    // --- Collect media IDs that need resolving ---
    // With .lean(), ObjectId fields are BSON ObjectId objects (typeof === 'object'),
    // not strings. We need to handle both cases.
    const primaryVal = product.primaryImage;
    if (primaryVal) {
      // Skip if already a populated doc (has secureUrl or url)
      if (typeof primaryVal === 'object' && (primaryVal.secureUrl || primaryVal.url)) {
        // already populated
      } else {
        const id = primaryVal.toString();
        if (mongoose.Types.ObjectId.isValid(id)) mediaIdSet.add(id);
      }
    }
    // Stray 'image' field (ObjectId or string from legacy seeding)
    if (product.image) {
      if (typeof product.image === 'object' && (product.image.secureUrl || product.image.url)) {
        // already populated
      } else {
        const id = product.image.toString();
        if (mongoose.Types.ObjectId.isValid(id)) mediaIdSet.add(id);
      }
    }
    // images array: collect any that are raw IDs
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (!img) continue;
        if (typeof img === 'object' && (img.secureUrl || img.url)) continue; // populated
        const id = img.toString();
        if (mongoose.Types.ObjectId.isValid(id)) mediaIdSet.add(id);
      }
    }

    // --- Collect category refs that need resolving ---
    const catVal = product.category;
    if (catVal) {
      if (typeof catVal === 'object' && catVal.name) {
        // Already a populated category doc, skip
      } else {
        const catStr = catVal.toString();
        if (mongoose.Types.ObjectId.isValid(catStr)) {
          categoryIdSet.add(catStr);
        } else {
          // It's a string name like "Decor"
          categoryNameSet.add(catStr);
        }
      }
    }
  }

  // Batch-fetch Media and Category docs in parallel
  const mediaMap = new Map();
  const categoryMap = new Map();

  const mediaPromise =
    mediaIdSet.size > 0
      ? Media.find({ _id: { $in: Array.from(mediaIdSet) } })
          .select('secureUrl publicId url')
          .lean()
          .then((docs) => {
            for (const doc of docs) mediaMap.set(doc._id.toString(), doc);
          })
          .catch((err) =>
            logger.warn('resolveProductRefs media fetch warning', { error: err.message }),
          )
      : Promise.resolve();

  const categoryQueries = [];
  if (categoryIdSet.size > 0) {
    categoryQueries.push({ _id: { $in: Array.from(categoryIdSet) } });
  }
  if (categoryNameSet.size > 0) {
    categoryQueries.push({ name: { $in: Array.from(categoryNameSet) } });
  }
  const categoryPromise =
    categoryQueries.length > 0
      ? Category.find(categoryQueries.length === 1 ? categoryQueries[0] : { $or: categoryQueries })
          .select('name slug description')
          .lean()
          .then((docs) => {
            for (const doc of docs) {
              categoryMap.set(doc._id.toString(), doc);
              categoryMap.set(doc.name, doc);
            }
          })
          .catch((err) =>
            logger.warn('resolveProductRefs category fetch warning', { error: err.message }),
          )
      : Promise.resolve();

  await Promise.all([mediaPromise, categoryPromise]);

  // Patch each product in-place
  for (const product of products) {
    // --- Resolve primaryImage ---
    const primaryVal = product.primaryImage;
    const primaryPopulated =
      primaryVal && typeof primaryVal === 'object' && (primaryVal.secureUrl || primaryVal.url);

    if (!primaryPopulated) {
      // Try primaryImage ID, then fall back to stray 'image' field
      const primaryId = primaryVal ? primaryVal.toString() : null;
      const imageId = product.image ? product.image.toString() : null;

      const resolvedId =
        primaryId && mongoose.Types.ObjectId.isValid(primaryId) && mediaMap.has(primaryId)
          ? primaryId
          : imageId && mongoose.Types.ObjectId.isValid(imageId) && mediaMap.has(imageId)
            ? imageId
            : null;

      if (resolvedId) {
        product.primaryImage = mediaMap.get(resolvedId);
      }
    }

    // --- Resolve images array ---
    if (Array.isArray(product.images)) {
      product.images = product.images.map((img) => {
        if (img && typeof img === 'object' && (img.secureUrl || img.url)) return img;
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
        product.category = { name: catStr, slug: catStr.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
      }
    }
  }
};

const MAX_LIMIT = 100;

export const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    if (req.query.category) {
      // Escape regex special characters to prevent ReDoS / pattern broadening
      const escapedCategory = req.query.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Normalise slug for exact match (lowercase, hyphens for spaces)
      const normalizedSlug = req.query.category.trim().toLowerCase().replace(/\s+/g, '-');

      // Try to find the category by name OR slug
      const categoryDoc = await Category.findOne({
        $or: [
          { name: { $regex: `^${escapedCategory}$`, $options: 'i' } },
          { slug: normalizedSlug },
        ],
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
      // Sanitize: trim, limit length, strip control characters
      const rawSearch = String(req.query.search).trim().slice(0, 200);
      const controlCharsRegExp = new RegExp('[\\x00-\\x1f\\x7f]', 'g');
      const safeSearch = rawSearch.replace(controlCharsRegExp, '');
      if (safeSearch) {
        query.$text = { $search: safeSearch };
      }
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

    // Best-effort: mark media as used (don't fail the request if this throws)
    try {
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
    } catch (mediaErr) {
      logger.warn('Failed to update media usedBy after product creation', {
        productId: product._id,
        error: mediaErr.message,
      });
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
    if (req.body.category) {
      const newCatId = req.body.category.toString();
      const existingCatId = product.category ? product.category.toString() : null;
      if (!existingCatId || newCatId !== existingCatId) {
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
    }

    // Validate primaryImage if being updated
    if (req.body.primaryImage) {
      const newImgId = req.body.primaryImage.toString();
      const existingImgId = product.primaryImage ? product.primaryImage.toString() : null;
      if (!existingImgId || newImgId !== existingImgId) {
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

    // Use Set-based diff across ALL media refs (primary + gallery) so an asset
    // moving from primaryImage into images (or vice versa) isn't wrongly removed.
    const oldMediaIds = new Set([oldPrimary, ...oldImages].filter(Boolean));
    const newMediaIds = new Set([newPrimary, ...newImages].filter(Boolean));

    const removed = [...oldMediaIds].filter((id) => !newMediaIds.has(id));
    if (removed.length) {
      await Media.updateMany(
        { _id: { $in: removed } },
        { $pull: { usedBy: { modelId: product._id } } },
      ).catch((err) => {
        logger.warn('Failed to update removed media usedBy', { error: err.message });
      });
    }

    const added = [...newMediaIds].filter((id) => !oldMediaIds.has(id));
    if (added.length) {
      await Media.updateMany(
        { _id: { $in: added } },
        { $addToSet: { usedBy: { modelType: 'Product', modelId: product._id } } },
      ).catch((err) => {
        logger.warn('Failed to update added media usedBy', { error: err.message });
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

    // Delete the product FIRST — this is the critical operation.
    // Media cleanup is best-effort and should not block deletion.
    await product.deleteOne();
    logger.info('Product deleted successfully', { productId: req.params.id });

    await invalidateCache('cache:/api/product*');
    await invalidateCache(`cache:/api/product/${req.params.id}`);

    // Best-effort media cleanup after product is already gone
    if (mediaIds.length) {
      try {
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
            // Re-check authoritatively: re-fetch the live doc and verify
            // no other model references this media before deleting
            const liveMedia = await Media.findById(m._id);
            if (!liveMedia || liveMedia.usedBy.length > 0) {
              logger.info('Skipping media deletion — concurrent reference detected', {
                mediaId: m._id,
              });
              continue;
            }

            // Check if any Product or Category still references this media
            const [productRef, categoryRef] = await Promise.all([
              Product.exists({
                $or: [{ primaryImage: m._id }, { images: m._id }],
              }),
              Category.exists({ image: m._id }),
            ]);

            if (productRef || categoryRef) {
              logger.info('Skipping media deletion — still referenced by another document', {
                mediaId: m._id,
                productRef: !!productRef,
                categoryRef: !!categoryRef,
              });
              continue;
            }

            await deleteMediaFromCloudinary(m.publicId);
            await liveMedia.deleteOne();
            logger.info('Deleted unused media', { mediaId: m._id, publicId: m.publicId });
          } catch (e) {
            logger.warn('Failed to delete unused media', { mediaId: m._id, error: e.message });
          }
        }
      } catch (err) {
        logger.warn('Failed to clean up media after product deletion', {
          productId: req.params.id,
          error: err.message,
        });
      }
    }

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
