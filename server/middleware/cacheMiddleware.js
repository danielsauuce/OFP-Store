import { cacheHelpers } from '../config/upstashRedis.js';
import logger from '../utils/logger.js';

/**
 * Middleware to cache GET requests
 * @param {number} duration - cache duration in seconds (default 3600 = 1 hour)
 */
export const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    // Only cache GET requests without auth
    if (req.method !== 'GET' || req.headers.authorization) return next();

    const cacheKey = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await cacheHelpers.get(cacheKey);

      if (cachedData) {
        logger.info('Cache HIT', { key: cacheKey });
        // @upstash/redis automatically deserializes JSON on get(),
        // so cachedData is already a plain object — no JSON.parse() needed.
        return res.status(200).json(cachedData);
      }

      logger.info('Cache MISS', { key: cacheKey });

      // Override res.json to cache successful responses
      const originalJson = res.json.bind(res);

      res.json = (data) => {
        // Fire-and-forget: cache in the background so the response is not delayed
        if (res.statusCode === 200 && data?.success !== false) {
          cacheHelpers
            .set(cacheKey, data, duration)
            .then((wasCached) => {
              if (wasCached) {
                logger.info('Response cached', { key: cacheKey, duration });
              } else {
                logger.warn('Cache write skipped/failed', { key: cacheKey, duration });
              }
            })
            .catch((error) =>
              logger.error('Failed to cache response:', { error: error.message, key: cacheKey }),
            );
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

/**
 * Function to invalidate cache by pattern
 * @param {string} pattern - pattern to match keys (e.g., "cache:/api/products*")
 */
export const invalidateCache = async (pattern) => {
  try {
    await cacheHelpers.delPattern(pattern);
    logger.info('Cache invalidated', { pattern });
  } catch (error) {
    logger.error('Cache invalidation error:', { error: error.message });
  }
};
