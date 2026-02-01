import Joi from 'joi';
import { objectIdSchema } from './common.js';

export const createTicketValidation = Joi.object({
  subject: Joi.string().min(3).max(200).trim().required(),
  message: Joi.string().min(10).max(2000).trim().required(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  // guestName & guestEmail only if not authenticated → handled in controller
});

export const addReplyValidation = Joi.object({
  text: Joi.string().min(2).max(2000).trim().required(),
});

export const updateTicketStatusValidation = Joi.object({
  status: Joi.string().valid('new', 'open', 'in_progress', 'resolved', 'closed').required(),
  priority: Joi.string().valid('low', 'medium', 'high'),
});

export default {
  createTicketValidation,
  addReplyValidation,
  updateTicketStatusValidation,
};
