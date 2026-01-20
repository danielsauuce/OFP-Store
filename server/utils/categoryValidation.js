import Joi from 'joi';

export const categoryValidation = Joi.object({
  name: Joi.string()
    .valid('All', 'Sofas', 'Tables', 'Chairs', 'Beds', 'Storage', 'Lighting', 'Decor')
    .required(),
  description: Joi.string().optional(),
  image: Joi.string().uri().optional(),
  isActive: Joi.boolean().optional(),
  order: Joi.number().optional(),
});

export default { categoryValidation };
