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
  logger.info('Get all product endpoint hit');

  try {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (inStock !== undefined) query.inStock = inStock === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const allowedSortFields = ['createdAt', 'price', 'name', 'updatedAt'];
    let sortObj = { createdAt: -1 };

    if (sort) {
      const direction = sort.startsWith('-') ? -1 : 1;
      const field = sort.replace('-', '');

      if (allowedSortFields.includes(field)) {
        sortObj = { [field]: direction };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('Get all products error', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
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

    // Clear cache after creation
    try {
      await invalidateCache('cache:/api/product*');
    } catch (err) {
      logger.error('Cache invalidation failed on product creation', err);
    }

    res.status(201).json({ success: true, message: 'Product created successfully', product });
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

// export const updateProduct = async (req, res) => {
//   try {
//     const { error: idError } = productIdValidation.validate({ id: req.params.id });
//     if (idError) {
//       return res.status(400).json({
//         success: false,
//         message: idError.details[0].message,
//       });
//     }

//     const { error } = updateProductValidation.validate(req.body, {
//       abortEarly: false,
//     });

//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: error.details.map((d) => d.message),
//       });
//     }

//     const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found',
//       });
//     }

//     await Promise.all([
//       invalidateCache('cache:/api/products*'),
//       invalidateCache(`cache:/api/products/${req.params.id}`),
//     ]);

//     res.status(200).json({
//       success: true,
//       message: 'Product updated successfully',
//       product,
//     });
//   } catch (error) {
//     logger.error('Update product error', {
//       message: error.message,
//       stack: error.stack,
//     });

//     res.status(500).json({
//       success: false,
//       message: 'Failed to update product',
//     });
//   }
// };

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
