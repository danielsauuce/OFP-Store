import Joi from 'joi';
import { objectId } from './common.js';

export const createCategory = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  description: Joi.string().max(500).trim(),
  image: objectId.optional(),
  parent: objectId.optional(),
  order: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

export const updateCategory = createCategory.keys({}).min(1);

export const reorder = Joi.object({ order: Joi.number().integer().min(0).required() });
