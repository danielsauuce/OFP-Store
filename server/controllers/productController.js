import Product from '../models/product.mjs';
import logger from '../utils/logger.js';
import {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
} from '../utils/productValidation.js';

export const createProduct = async (req, res) => {
  logger.info('Create Product endpoint hit');

  try {
    // 1. Validate request body
    const { error, value } = createProductValidation.validate(req.body);

    if (error) {
      logger.warn('Product validation error', error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // 2. Create product
    const product = new Product({ ...value });

    await product.save();

    logger.info('Product created successfully', { productId: product._id });

    // 3. Respond
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    logger.error('Error creating product', {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to create product',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};
