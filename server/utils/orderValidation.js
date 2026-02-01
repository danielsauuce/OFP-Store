import Joi from 'joi';
import { objectId } from './common.js';

export const createOrder = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: objectId.required(),
        variantSku: Joi.string().optional(),
        quantity: Joi.number().min(1).integer().required(),
      }),
    )
    .min(1)
    .required(),
  shippingAddress: Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().optional(),
    postalCode: Joi.string().required(),
    country: Joi.string().optional(),
  }).required(),
  paymentMethod: Joi.string().valid('card', 'pay_on_delivery', 'bank').required(),
  notes: Joi.string().optional(),
});

export const updateStatus = Joi.object({
  orderStatus: Joi.string()
    .valid('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    .required(),
  note: Joi.string().optional(),
});
