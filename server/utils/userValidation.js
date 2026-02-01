import Joi from 'joi';
import { objectId } from './common.js';

export const updateProfile = Joi.object({
  fullName: Joi.string().min(2).max(100).trim(),
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .trim(),
  addresses: Joi.array().items(
    Joi.object({
      isDefault: Joi.boolean(),
      fullName: Joi.string().trim(),
      phone: Joi.string().trim(),
      street: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim(),
      postalCode: Joi.string().trim().required(),
      country: Joi.string().trim(),
      type: Joi.string().valid('home', 'work', 'other'),
    }),
  ),
  preferences: Joi.object(),
}).min(1);

export const updateProfilePicture = Joi.object({ mediaId: objectId.required() });

export const updatePhone = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{9,15}$/)
    .required(),
});
