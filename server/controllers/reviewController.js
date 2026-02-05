import Review from '../models/review.js';
import Product from '../models/product.js';
import Order from '../models/order.js';
import logger from '../utils/logger.js';
import {
  createReview as createReviewValidation,
  updateReview as updateReviewValidation,
  approve as approveValidation,
} from '../utils/reviewValidation.js';

// Public: Get approved reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = {
      product: productId,
      isApproved: true,
    };

    const skip = (Number(page) - 1) * Number(limit);

    let sortOption = { createdAt: -1 };
    if (sort === 'helpful') {
      sortOption = { helpfulCount: -1, createdAt: -1 };
    } else if (sort.startsWith('-')) {
      sortOption = { [sort.slice(1)]: -1 };
    } else {
      sortOption = { [sort]: 1 };
    }

    const reviews = await Review.find(query)
      .populate('user', 'fullName profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('Get product reviews error', {
      productId: req.params.productId,
      error: error.message,
    });
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

// Authenticated: Create a new review (only if user purchased the product)
export const createReview = async (req, res) => {
  try {
    const { error } = createReviewValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { product: productId, rating, content } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.exists({
      user: userId,
      'items.product': productId,
      orderStatus: { $in: ['delivered'] },
      paymentStatus: { $in: ['paid', 'pending'] }, // adjust based on your flow
    });

    // You can make this check strict or optional
    if (!hasPurchased) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only review products you have purchased' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return res
        .status(400)
        .json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      content,
      isVerifiedPurchase: !!hasPurchased, // true if purchased
      isApproved: false, // requires admin approval
    });

    // Note: averageRating and reviewCount are updated automatically via post-save hook in schema

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. It will appear after admin approval.',
      review,
    });
  } catch (error) {
    logger.error('Create review error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Failed to create review' });
  }
};

// Authenticated: Update own review
export const updateReview = async (req, res) => {
  try {
    const { error } = updateReviewValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: 'Review not found or not owned by you' });
    }

    // Optional: prevent update if already approved
    // if (review.isApproved) {
    //   return res.status(403).json({ success: false, message: 'Approved reviews cannot be edited' });
    // }

    Object.assign(review, req.body);
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    logger.error('Update review error', { reviewId: req.params.reviewId, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update review' });
  }
};

// Authenticated: Delete own review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: 'Review not found or not owned by you' });
    }

    await review.deleteOne();

    // Note: averageRating and reviewCount are updated via post-deleteOne hook

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    logger.error('Delete review error', { reviewId: req.params.reviewId, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};

// Admin endpoints
export const getAllReviewsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, approved, productId } = req.query;

    const query = {};
    if (approved !== undefined) query.isApproved = approved === 'true';
    if (productId) query.product = productId;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find(query)
      .populate('product', 'name slug')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error('Admin get all reviews error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

export const approveReview = async (req, res) => {
  try {
    const { error } = approveValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.isApproved = isApproved;
    await review.save();

    // Product stats are automatically updated via schema hooks

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
      review,
    });
  } catch (error) {
    logger.error('Approve review error', { reviewId: req.params.reviewId, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update review approval' });
  }
};
