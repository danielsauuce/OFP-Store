import Joi from 'joi';

export const createProductValidation = Joi.object({
  name: Joi.string().min(3).max(200).required().trim().messages({
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 3 characters',
    'string.max': 'Product name cannot exceed 200 characters',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().min(10).max(2000).required().trim().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 2000 characters',
    'any.required': 'Description is required',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be greater than 0',
    'any.required': 'Price is required',
  }),
  image: Joi.string().uri().required().messages({
    'string.uri': 'Image must be a valid URL',
    'any.required': 'Product image is required',
  }),
  images: Joi.array().items(Joi.string().uri()).messages({
    'string.uri': 'Each image must be a valid URL',
  }),
  category: Joi.string()
    .valid('Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor')
    .required()
    .messages({
      'any.only': 'Category must be one of: Sofas, Tables, Chairs, Beds, Storage, Lighting, Decor',
      'any.required': 'Category is required',
    }),
  material: Joi.string().trim(),
  dimensions: Joi.string().trim(),
  stockQuantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock quantity must be a number',
    'number.integer': 'Stock quantity must be a whole number',
    'number.min': 'Stock quantity cannot be negative',
    'any.required': 'Stock quantity is required',
  }),
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
