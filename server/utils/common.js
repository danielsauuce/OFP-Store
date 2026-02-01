import Joi from 'joi';

export const register = Joi.object({
  fullName: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .optional(),
});

export const login = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const changePassword = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).required(),
});

export const forgotPassword = Joi.object({ email: Joi.string().email().required() });

export const resetPassword = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const verifyEmail = Joi.object({ token: Joi.string().required() });
