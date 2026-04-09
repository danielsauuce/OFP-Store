import mongoose from 'mongoose';
import Review from '../models/review.js';
import Product from '../models/product.js';
import logger from '../utils/logger.js';
import {
  createReview as createReviewValidation,
  updateReview as updateReviewValidation,
  approve as approveValidation,
} from '../utils/reviewValidation.js';

// Whitelist of allowed sort fields
const ALLOWED_SORT_FIELDS = ['createdAt', 'rating', 'helpfulCount'];
const MAX_LIMIT = 50;

// Public: Get approved reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), MAX_LIMIT);
    const sortParam = String(req.query.sort || '-createdAt');

    const query = {
      product: productId,
      isApproved: true,
    };

    const skip = (page - 1) * limit;

    // Whitelist sort fields and sanitize direction
    let sortOption = { createdAt: -1 };
    if (sortParam === 'helpful') {
      sortOption = { helpfulCount: -1, createdAt: -1 };
    } else {
      const isDesc = sortParam.startsWith('-');
      const fieldName = isDesc ? sortParam.slice(1) : sortParam;
      if (ALLOWED_SORT_FIELDS.includes(fieldName)) {
        sortOption = { [fieldName]: isDesc ? -1 : 1 };
      }
    }

    const reviews = await Review.find(query)
      .populate('user', 'fullName profilePicture')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
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

// Authenticated: Create a new review
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

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

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
      isVerifiedPurchase: false,
      isApproved: false,
    });

    const populated = await review.populate('user', 'fullName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      review: populated,
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
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), MAX_LIMIT);

    const query = {};

    // Sanitize approved — only accept 'true' or 'false' strings
    if (req.query.approved === 'true') query.isApproved = true;
    else if (req.query.approved === 'false') query.isApproved = false;

    // Sanitize productId — must be a valid ObjectId string
    if (req.query.productId && /^[a-f0-9]{24}$/i.test(String(req.query.productId))) {
      query.product = String(req.query.productId);
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find(query)
      .populate('product', 'name slug')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
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

    res.status(200).json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'hidden'} successfully`,
      review,
    });
  } catch (error) {
    logger.error('Approve review error', { reviewId: req.params.reviewId, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update review visibility' });
  }
};

// Admin: permanently delete any review
export const deleteReviewAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ success: false, message: 'Invalid review id' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await review.deleteOne();

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Admin delete review error', {
      reviewId: req.params.reviewId,
      error: error.message,
    });
    res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};
