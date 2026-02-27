import Joi from 'joi';

export const updateSettings = Joi.object({
  /* Flexible, e.g. */ shippingRates: Joi.object(),
  paymentMethods: Joi.array().items(Joi.string()),
}).min(1);

export const updateShipping = Joi.object({ rates: Joi.object().required() });

export const updatePayment = Joi.object({ methods: Joi.array().items(Joi.string()).required() });
