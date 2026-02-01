import Joi from 'joi';

export const addAddress = Joi.object({
  fullName: Joi.string().trim(),
  phone: Joi.string().trim(),
  street: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  state: Joi.string().trim(),
  postalCode: Joi.string().trim().required(),
  country: Joi.string().trim(),
  type: Joi.string().valid('home', 'work', 'other'),
  isDefault: Joi.boolean(),
});

export const updateAddress = addAddress;

export const setDefault = Joi.object({ isDefault: Joi.boolean().required() });
