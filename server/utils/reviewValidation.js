import Joi from 'joi';

export const createReviewValidation = Joi.object({
  productId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  content: Joi.string().min(10).max(500).required(),
});

export const approveReviewValidation = Joi.object({
  isApproved: Joi.boolean().required(),
});

export default {
  createReviewValidation,
  approveReviewValidation,
};
