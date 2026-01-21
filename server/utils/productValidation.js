import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    'string.base': 'Product name must be a string',
    'string.empty': 'Product name is required',
    'string.min': 'Product name must be at least 3 characters',
    'string.max': 'Product name cannot exceed 100 characters',
    'any.required': 'Product name is required',
  }),

  description: Joi.string().trim().min(20).max(2000).required().messages({
    'string.base': 'Description must be a string',
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 20 characters',
    'string.max': 'Description cannot exceed 2000 characters',
    'any.required': 'Description is required',
  }),

  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),

  image: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.base': 'Main image must be a string (URL)',
      'string.empty': 'Main image is required',
      'string.uri': 'Main image must be a valid URL',
      'any.required': 'Main image is required',
    }),

  images: Joi.array()
    .items(
      Joi.string()
        .trim()
        .uri({ scheme: ['http', 'https'] })
        .messages({
          'string.base': 'Each additional image must be a valid URL',
          'string.uri': 'Additional image must be a valid URL',
        }),
    )
    .optional()
    .messages({
      'array.base': 'Images must be an array of URLs',
    }),

  category: Joi.string()
    .valid('Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor')
    .required()
    .messages({
      'any.only':
        'Invalid category. Must be one of: Sofas, Tables, Chairs, Beds, Storage, Lighting, Decor',
      'any.required': 'Category is required',
    }),

  material: Joi.string().trim().allow('').optional().messages({
    'string.base': 'Material must be a string',
  }),

  dimensions: Joi.string().trim().allow('').optional().messages({
    'string.base': 'Dimensions must be a string',
  }),

  stockQuantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock quantity must be a number',
    'number.integer': 'Stock quantity must be an integer',
    'number.min': 'Stock quantity cannot be negative',
    'any.required': 'Stock quantity is required',
  }),

  inStock: Joi.boolean().optional().messages({
    'boolean.base': 'In-stock status must be true or false',
  }),

  isFeatured: Joi.boolean().optional().default(false),

  isActive: Joi.boolean().optional().default(true),

  averageRating: Joi.number().min(0).max(5).optional().default(0),

  reviewCount: Joi.number().integer().min(0).optional().default(0),

  tags: Joi.array().items(Joi.string().trim()).optional(),
});

// For update
export const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  description: Joi.string().trim().min(20).max(2000).optional(),
  price: Joi.number().min(0).optional(),
  image: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  images: Joi.array()
    .items(Joi.string().uri({ scheme: ['http', 'https'] }))
    .optional(),
  category: Joi.string()
    .valid('Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor')
    .optional(),
  material: Joi.string().trim().allow('').optional(),
  dimensions: Joi.string().trim().allow('').optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  inStock: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  averageRating: Joi.number().min(0).max(5).optional(),
  reviewCount: Joi.number().integer().min(0).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
}).min(1); // at least one field must be provided for update
