import Joi from 'joi';

export const createOrderValidation = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
      }),
    )
    .min(1)
    .required(),

  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().optional(),
    postalCode: Joi.string().required(),
    country: Joi.string().optional(),
  }).required(),

  paymentMethod: Joi.string().valid('card', 'delivery', 'pay_on_delivery').required(),
});

export default { createOrderValidation };
