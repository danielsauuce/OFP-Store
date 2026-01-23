import Joi from 'joi';

export const registerValidation = Joi.object({
  fullName: Joi.string().min(2).max(100).required().trim(),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(8).required(),
});

export const loginValidation = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required(),
});

export const changePasswordValidation = Joi.object({
  currentPassword: Joi.string().min(8).required().messages({
    'string.empty': 'Current password is required',
    'string.min': 'Current password must be at least 8 characters',
  }),
  newPassword: Joi.string().min(8).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters',
  }),
});

export const updateProfileValidation = Joi.object({
  fullName: Joi.string().min(2).max(100).trim(),
  phone: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .trim()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits',
    }),
  address: Joi.object({
    street: Joi.string().trim(),
    city: Joi.string().trim(),
    state: Joi.string().trim(),
    postalCode: Joi.string().trim(),
    country: Joi.string().trim(),
  }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const userIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'User ID is required',
    }),
});

export const updateUserStatusValidation = Joi.object({
  isActive: Joi.boolean().required().messages({
    'any.required': 'Status is required',
  }),
});

export const updateUserRoleValidation = Joi.object({
  role: Joi.string().valid('user', 'admin').required().messages({
    'any.only': 'Role must be either user or admin',
    'any.required': 'Role is required',
  }),
});

export default {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  updateProfileValidation,
  userIdValidation,
  updateUserStatusValidation,
  updateUserRoleValidation,
};
