import Joi from 'joi';
import { objectId } from './common.js';

export const createReview = Joi.object({
  product: objectId.required(),
  rating: Joi.number().min(1).max(5).integer().required(),
  content: Joi.string().min(10).max(1000).trim().required(),
});

export const updateReview = Joi.object({
  rating: Joi.number().min(1).max(5).integer(),
  content: Joi.string().min(10).max(1000).trim(),
}).min(1);

export const approve = Joi.object({ isApproved: Joi.boolean().required() });
