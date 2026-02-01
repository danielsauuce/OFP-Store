import Joi from 'joi';

export const registerValidation = Joi.object({
  fullName: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .trim()
    .optional(),
});

export const loginValidation = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

export const changePasswordValidation = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).required(),
});

export const updateProfileValidation = Joi.object({
  fullName: Joi.string().min(2).max(100).trim(),
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .trim(),
  profilePicture: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  addresses: Joi.array().items(
    Joi.object({
      isDefault: Joi.boolean().default(false),
      street: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim(),
      postalCode: Joi.string().trim().required(),
      country: Joi.string().trim().required(),
      type: Joi.string().valid('home', 'work', 'other').default('home'),
    }),
  ),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export default {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  updateProfileValidation,
};
