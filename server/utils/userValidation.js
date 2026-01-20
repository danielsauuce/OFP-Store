import Joi from 'joi';

export const registerValidation = Joi.object({
  fullName: Joi.string().min(2).max(50).required().trim(),
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
export default { registerValidation, loginValidation, changePasswordValidation };
