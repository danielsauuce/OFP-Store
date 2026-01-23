import { delPattern } from '../config/redisClient.js';

import logger from '../utils/logger.js';

const rateLimiterMiddleware = async (req, res, next) => {
  const { rateLimiter } = delPattern;

  if (!rateLimiter) {
    logger.warn('Rate limiter not initialized (Redis unavailable), skipping for this request');
    return next();
  }

  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rateLimiterRes) {
    const retrySecs = rateLimiterRes.msBeforeNext
      ? Math.ceil(rateLimiterRes.msBeforeNext / 1000)
      : 60;

    res.set('Retry-After', String(retrySecs));
    logger.warn(`Rate limit exceeded for IP ${req.ip} - Retry after ${retrySecs}s`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: retrySecs,
    });
  }
};

export default rateLimiterMiddleware;
