import Ticket from '../models/ticket.js';
import logger from '../utils/logger.js';
import {
  createTicket as createTicketValidation,
  addReply as addReplyValidation,
  updateTicket as updateTicketValidation,
} from '../utils/ticketValidation.js';

// Allowed enum values for query filtering
const ALLOWED_STATUSES = ['new', 'open', 'in_progress', 'resolved', 'closed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Customer endpoints

export const createTicket = async (req, res) => {
  try {
    const { error } = createTicketValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const { subject, message, priority, name, email } = req.body;
    const userId = req.user ? req.user.id : null;

    const ticket = await Ticket.create({
      user: userId,
      name: userId ? undefined : name,
      email: userId ? undefined : email,
      subject,
      message,
      priority: priority || 'medium',
      status: 'new',
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId: ticket._id,
    });
  } catch (error) {
    logger.error('Create ticket error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await Ticket.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('subject status priority createdAt updatedAt replies')
      .lean();

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    logger.error('Get my tickets error', { userId: req.user?.id, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch your tickets' });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const ticket = await Ticket.findOne({ _id: id, user: userId })
      .populate('replies.author', 'fullName profilePicture')
      .lean();

    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: 'Ticket not found or not authorized' });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    logger.error('Get ticket by id error', { ticketId: req.params.id, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
};

export const addReply = async (req, res) => {
  try {
    const { error } = addReplyValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    const ticket = await Ticket.findOne({ _id: id, user: userId });
    if (!ticket) {
      return res
        .status(404)
        .json({ success: false, message: 'Ticket not found or not authorized' });
    }

    if (['closed', 'resolved'].includes(ticket.status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Cannot reply to closed or resolved ticket' });
    }

    ticket.replies.push({
      text,
      author: userId,
    });

    if (ticket.status === 'new') {
      ticket.status = 'open';
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      ticket,
    });
  } catch (error) {
    logger.error('Add reply error', { ticketId: req.params.id, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to add reply' });
  }
};

// Admin endpoints

export const getAllTicketsAdmin = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    const query = {};

    // Whitelist status values to prevent NoSQL injection
    const statusParam = String(req.query.status || '');
    if (statusParam && ALLOWED_STATUSES.includes(statusParam)) {
      query.status = statusParam;
    }

    // Whitelist priority values to prevent NoSQL injection
    const priorityParam = String(req.query.priority || '');
    if (priorityParam && ALLOWED_PRIORITIES.includes(priorityParam)) {
      query.priority = priorityParam;
    }

    const skip = (page - 1) * limit;

    const tickets = await Ticket.find(query)
      .populate('user', 'fullName email phone')
      .populate('assignedTo', 'fullName')
      .populate('replies.author', 'fullName role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Ticket.countDocuments(query);

    res.status(200).json({
      success: true,
      tickets,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    logger.error('Admin get all tickets error', { error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
};

export const getTicketAdmin = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('user', 'fullName email phone')
      .populate('assignedTo', 'fullName')
      .populate('replies.author', 'fullName role')
      .lean();

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    logger.error('Admin get ticket error', { ticketId: req.params.id, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
};

export const updateTicketAdmin = async (req, res) => {
  try {
    const { error } = updateTicketValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => d.message),
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const { status, priority, assignedTo } = req.body;

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      ticket,
    });
  } catch (error) {
    logger.error('Admin update ticket error', { ticketId: req.params.id, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to update ticket' });
  }
};

export const addAdminReply = async (req, res) => {
  try {
    const { error } = addReplyValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { id } = req.params;
    const { text } = req.body;
    const adminId = req.user.id;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.replies.push({
      text,
      author: adminId,
    });

    if (ticket.status === 'new') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      ticket,
    });
  } catch (error) {
    logger.error('Admin add reply error', { ticketId: req.params.id, error: error.message });
    res.status(500).json({ success: false, message: 'Failed to add reply' });
  }
};
