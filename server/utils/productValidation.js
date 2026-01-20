import Joi from 'joi';

export const createProductValidation = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  image: Joi.string().uri().required(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  category: Joi.string()
    .valid('Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor')
    .required(),
  material: Joi.string().optional(),
  dimensions: Joi.string().optional(),
  stockQuantity: Joi.number().min(0).optional(),
  isFeatured: Joi.boolean().optional(),
});

export const updateProductValidation = createProductValidation.fork(
  Object.keys(createProductValidation.describe().keys),
  (schema) => schema.optional(),
);

export default { createProductValidation, updateProductValidation };
