import Joi from 'joi';
import { objectId } from './common.js';

export const addItem = Joi.object({
  product: objectId.required(),
  variantSku: Joi.string().optional(),
  quantity: Joi.number().min(1).integer().default(1),
});

export const updateItem = Joi.object({ quantity: Joi.number().min(1).integer().required() });
