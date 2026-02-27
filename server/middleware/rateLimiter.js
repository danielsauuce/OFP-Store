import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from '../utils/logger.js';
import { cacheHelpers } from '../config/upstashRedis.js';

// Using memory limiter with fallback for production
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 1,
});

const rateLimiterMiddleware = async (req, res, next) => {
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
