import Joi from 'joi';

export const contactValidation = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(10).max(1000).required(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
});

export const addNoteValidation = Joi.object({
  text: Joi.string().required(),
  status: Joi.string().valid('new', 'open', 'in_progress', 'resolved', 'closed').optional(),
});

export default {
  contactValidation,
  addNoteValidation,
};
