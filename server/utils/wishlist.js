import Joi from 'joi';
import { objectId } from './common.js';

export const addToWishlist = Joi.object({ productId: objectId.required() });
