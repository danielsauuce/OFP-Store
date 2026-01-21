import Product from '../models/product.js';
import logger from '../utils/logger.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';
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

    // pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    logger.info('Products fetched successfully', {
      count: products.length,
      total,
      page,
    });

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
    logger.error('Get all products error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

export const getProductById = async (req, res) => {
  logger.info('Get product by ID endpoint hit');

  try {
    const { error } = productIdValidation.validate({ id: req.params.id });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      logger.warn('Product not found', { productId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    logger.info('Product fetched successfully', { productId: product._id });

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    logger.error('Get product by ID error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
    });
  }
};

export const createProduct = async (req, res) => {
  logger.info('Create product endpoint hit');

  try {
    const { error } = createProductValidation.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    const product = new Product(req.body);
    await product.save();

    await invalidateCache('cache:/api/products*');

    logger.info('Product created successfully', {
      productId: product._id,
      adminId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    logger.error('Create product error:', {
      message: error.message,
      stack: error.stack,
    });

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Product with this name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
    });
  }
};

export const updateProduct = async (req, res) => {
  logger.info('Update all product endpoint hit');

  try {
    const { error: idError } = productIdValidation.validate({ id: req.params.id });
    if (idError) {
      return res.status(400).json({
        success: false,
        message: idError.details[0].message,
      });
    }

    const { error } = updateProductValidation.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      logger.warn('Product not found for update', { productId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Promise.all([
      invalidateCache('cache:/api/products*'),
      invalidateCache(`cache:/api/products/${req.params.id}`),
    ]);

    logger.info('Product updated successfully', {
      productId: product._id,
      adminId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    logger.error('Update product error:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
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
      logger.warn('Product not found for deletion', { productId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Promise.all([
      invalidateCache('cache:/api/products*'),
      invalidateCache(`cache:/api/products/${req.params.id}`),
    ]);

    logger.info('Product deleted successfully', {
      productId: req.params.id,
      adminId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Delete product error:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
    });
  }
};
