import Joi from 'joi';
import { objectId } from './common.js';

export const createTicket = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  subject: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(10).max(2000).required(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
});

export const updateTicket = Joi.object({
  status: Joi.string().valid('new', 'open', 'in_progress', 'resolved', 'closed'),
  priority: Joi.string().valid('low', 'medium', 'high'),
  assignedTo: objectId.optional(),
}).min(1);

export const addReply = Joi.object({ text: Joi.string().min(2).required() });
