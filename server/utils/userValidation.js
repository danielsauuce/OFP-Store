import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const objectIdSchema = objectId;

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

export const forgotPasswordValidation = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordValidation = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const updateProfileValidation = Joi.object({
  fullName: Joi.string().min(2).max(100).trim(),
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .trim(),
  profilePicture: objectId.optional(),
  addresses: Joi.array().items(
    Joi.object({
      isDefault: Joi.boolean().default(false),
      fullName: Joi.string().trim(),
      phone: Joi.string().trim(),
      street: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim(),
      postalCode: Joi.string().trim().required(),
      country: Joi.string().trim().required(),
      type: Joi.string().valid('home', 'work', 'other').default('home'),
    }),
  ),
  preferences: Joi.object(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

export const updateProfilePicture = Joi.object({
  mediaId: objectId.required(),
});

export const updatePhoneValidation = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .required(),
});

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

export const forgotPassword = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPassword = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const verifyEmail = Joi.object({
  token: Joi.string().required(),
});

export const userIdValidation = Joi.object({
  id: objectId.required(),
});

export const updateUserRoleValidation = Joi.object({
  role: Joi.string().valid('user', 'admin').required(),
});

export const updateUserStatusValidation = Joi.object({
  isActive: Joi.boolean().required(),
});