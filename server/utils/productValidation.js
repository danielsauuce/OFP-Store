import Joi from 'joi';
import { objectId } from './common.js';

export const createProduct = Joi.object({
  name: Joi.string().min(3).max(200).trim().required(),
  description: Joi.string().min(20).max(5000).trim().required(),
  shortDescription: Joi.string().max(160).trim(),
  price: Joi.number().positive().precision(2).required(),
  compareAtPrice: Joi.number().positive().precision(2).greater(Joi.ref('price')).optional(),
  primaryImage: objectId.required(),
  images: Joi.array().items(objectId).max(10),
  category: objectId.required(),
  variants: Joi.array().items(
    Joi.object({
      sku: Joi.string().required(),
      price: Joi.number().min(0),
      stockQuantity: Joi.number().min(0).integer(),
      attributes: Joi.object(),
    }),
  ),
  material: Joi.string().trim(),
  dimensions: Joi.object({ width: Joi.number(), height: Joi.number(), depth: Joi.number() }),
  stockQuantity: Joi.number().min(0).integer(),
  isFeatured: Joi.boolean(),
  isActive: Joi.boolean(),
  metadata: Joi.object(),
});

// Use .fork() to make required fields optional for updates, then .min(1) to require at least one field
export const updateProduct = createProduct
  .fork(['name', 'description', 'price', 'primaryImage', 'category'], (schema) => schema.optional())
  .min(1);

export const updateStock = Joi.object({ stockQuantity: Joi.number().min(0).integer().required() });

export const toggleFeatured = Joi.object({ isFeatured: Joi.boolean().required() });

export const uploadImages = Joi.object({ images: Joi.array().items(objectId).required() });
