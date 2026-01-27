import { cacheHelpers } from '../config/upstashRedis.js';
import logger from '../utils/logger.js';

export const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    if (req.headers.authorization) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      //getting the cached data
      const cachedData = await cacheHelpers.get(cacheKey);

      if (cachedData) {
        logger.info('Cache HIT', { key: cacheKey });
        return res.status(200).json(cachedData);
      }

      logger.info('Cache MISS', { key: cacheKey });

      const originalJson = res.json.bind(res);

      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success) {
          cacheHelpers.set(cacheKey, data, duration).catch((error) => {
            logger.error('Failed to cache response:', { error: error.message });
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', { error: error.message });
      next();
    }
  };
};

// Invalidate cache for specific patterns
export const invalidateCache = async (pattern) => {
  try {
    await cacheHelpers.delPattern(pattern);
    logger.info('Cache invalidated', { pattern });
  } catch (error) {
    logger.error('Cache invalidation error:', { error: error.message });
  }
};
