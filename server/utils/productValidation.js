import Joi from 'joi';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createProductValidation = Joi.object({
  name: Joi.string().min(3).max(200).required().trim(),
  description: Joi.string().min(10).max(2000).required().trim(),
  price: Joi.number().positive().precision(2).required(),
  imageMediaId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({ 'string.pattern.base': 'Invalid main image ID' }),
  imagesMediaIds: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .messages({ 'string.pattern.base': 'Invalid media ID in images array' }),
  category: Joi.string()
    .valid('Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor')
    .required(),
  material: Joi.string().trim(),
  dimensions: Joi.string().trim(),
  stockQuantity: Joi.number().integer().min(0).required(),
  isFeatured: Joi.boolean(),
  isActive: Joi.boolean(),
});

export const updateProductValidation = Joi.object({
  name: Joi.string().min(3).max(200).trim(),
  description: Joi.string().min(10).max(2000).trim(),
  price: Joi.number().positive().precision(2),
  image: Joi.string().uri(),
  images: Joi.array().items(Joi.string().uri()),
  category: Joi.string().valid('Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor'),
  material: Joi.string().trim(),
  dimensions: Joi.string().trim(),
  stockQuantity: Joi.number().integer().min(0),
  isFeatured: Joi.boolean(),
  isActive: Joi.boolean(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const productIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required',
    }),
});
