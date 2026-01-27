import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const verifyToken = (token, secretKey) => {
  return jwt.verify(token, secretKey);
};

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(req.user);

  if (!authHeader) {
    logger.warn('No authorization header or invalid format');
    return res.status(401).json({
      success: false,
      message: 'User is not authenticated',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No token provided');
    return res.status(401).json({
      success: false,
      message: 'User is not authenticated',
    });
  }

  try {
    const payload = verifyToken(token, process.env.JWT_SECRET);
    console.log(payload);

    req.user = {
      id: payload.userId,
      username: payload.username,
      role: payload.role,
    };
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};
