import logger from '../utils/logger.js';

export const isAdmin = (req, res, next) => {
  try {
    logger.info('Admin Middleware called');

    if (!req.user) {
      logger.warn('No user found in request');

      return res.status(401)({
        success: false,
        messgae: 'Authentication Required',
      });
    }

    // if user is not admin
    if (req.user.role !== 'admin') {
      logger.warn('Only admin user allowed', { userId: req.user.id, role: req.user.role });

      return res.status(403).json({
        success: false,
        message: 'Access denied, admin only allowed',
      });
    }

    next();
  } catch (error) {
    logger.error('Admin authorization error', { message: error.message, stack: error.stack });

    res.status(500).json({
      success: false,
      message: 'Authorization failed',
    });
  }
};
