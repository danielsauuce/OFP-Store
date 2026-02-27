import Joi from 'joi';

export const createPayment = Joi.object({
  // Called during order creation
  provider: Joi.string().required(),
  intentId: Joi.string().required(), // From gateway
  amount: Joi.number().positive().required(),
  currency: Joi.string().default('NGN'),
  method: Joi.string().valid('card', 'bank', 'mobile'),
});

export const updatePaymentStatus = Joi.object({
  status: Joi.string().valid('pending', 'succeeded', 'failed', 'refunded').required(),
});
