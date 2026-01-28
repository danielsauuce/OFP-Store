import Product from '../models/product.js';
import Media from '../models/media.js';
import logger from '../utils/logger.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';
import { deleteMediaFromCloudinary } from '../config/cloudinary.js';
import {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
} from '../utils/productValidation.js';

export const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, minPrice, maxPrice, sort } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const query = { isActive: true };

    // Category filter
    const allowedCategories = ['Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor'];

    if (category) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category',
        });
      }
      query.category = category;
    }

    // text search
    if (search) {
      query.$text = {
        $search: String(search).replace(/[^\w\s]/gi, ''),
      };
    }

    // Price filtering
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort) {
      sortOption = sort.startsWith('-') ? { [sort.substring(1)]: -1 } : { [sort]: 1 };
    }

    const products = await Product.find(query)
      .populate('image')
      .populate('images')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalProducts = await Product.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / Number(limit)),
      products,
    });
  } catch (error) {
    console.error('Get all products error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
      }),
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { error } = createProductValidation.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const product = await Product.create({ ...rest, image: imageMediaId, images: imagesMediaIds });

    // Update Media usage
    await Media.findByIdAndUpdate(imageMediaId, {
      $push: { usedBy: { modelType: 'Product', modelId: product._id } },
    });
    if (imagesMediaIds.length) {
      await Media.updateMany(
        { _id: { $in: imagesMediaIds } },
        { $push: { usedBy: { modelType: 'Product', modelId: product._id } } },
      );
    }

    // Clear product list cache so UI updates immediately
    try {
      await invalidateCache('cache:/api/product*');
    } catch (cacheErr) {
      logger.error('Cache invalidation failed', { message: cacheErr.message });
    }

    // Clear cache after creation
    try {
      await invalidateCache('cache:/api/product*');
    } catch (err) {
      logger.error('Cache invalidation failed on product creation', err);
    }

    res.status(201).json({ success: true, message: 'Product created successfully', product });

    await Promise.all([
      invalidateCache('cache:/api/product*'),
      invalidateCache(`cache:/api/product/${req.params.id}`),
    ]);
  } catch (error) {
    logger.error('Create product error', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct)
      return res.status(404).json({ success: false, message: 'Product not found' });

    const oldIds = [
      existingProduct.image.toString(),
      ...existingProduct.images.map((id) => id.toString()),
    ];
    const newIds = [req.body.imageMediaId, ...(req.body.imagesMediaIds || [])].filter(Boolean);

    const added = newIds.filter((id) => !oldIds.includes(id));
    const removed = oldIds.filter((id) => !newIds.includes(id));

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Sync media usedBy
    if (removed.length) {
      await Media.updateMany(
        { _id: { $in: removed } },
        { $pull: { usedBy: { modelId: product._id } } },
      );
    }
    if (added.length) {
      await Media.updateMany(
        { _id: { $in: added } },
        { $push: { usedBy: { modelType: 'Product', modelId: product._id } } },
      );
    }

    await Promise.all([
      invalidateCache('cache:/api/product*'),
      invalidateCache(`cache:/api/product/${req.params.id}`),
    ]);

    res.status(200).json({ success: true, message: 'Product updated successfully', product });
  } catch (error) {
    logger.error('Update product error', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { error } = productIdValidation.validate({ id: req.params.id });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const product = await Product.findById(req.params.id)
      .populate('image', 'secureUrl publicId')
      .populate('images', 'secureUrl publicId');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    logger.error('Get product by ID error', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
};

export const deleteProduct = async (req, res) => {
  logger.info('Delete product endpoint hit');

  try {
    const { error } = productIdValidation.validate({ id: req.params.id });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    //clean media up
    const medias = await Media.find({ 'usedBy.modelId': product._id });

    // Remove product reference from Media.usedBy
    await Media.updateMany(
      { 'usedBy.modelId': product._id },
      { $pull: { usedBy: { modelId: product._id } } },
    );

    // Delete Cloudinary media if no longer used
    for (const media of medias) {
      const refreshed = await Media.findById(media._id);
      if (refreshed && refreshed.usedBy.length === 0) {
        try {
          await deleteMediaFromCloudinary(refreshed.publicId);
          await Media.findByIdAndDelete(refreshed._id);
          logger.info('Deleted unused media', { mediaId: refreshed._id });
        } catch (err) {
          logger.error('Failed to delete media', {
            mediaId: refreshed._id,
            message: err.message,
            stack: err.stack,
          });
        }
      }
    }

    // Invalidate cache
    await Promise.all([
      invalidateCache('cache:/api/products*'),
      invalidateCache(`cache:/api/products/${req.params.id}`),
    ]);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Delete product error', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    });
  }
};
