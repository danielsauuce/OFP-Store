import { Redis } from 'ioredis';
import logger from '../utils/logger.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';

export const redisClient = new Redis(process.env.REDIS_URL);

export const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,
  duration: 1,
});

export const delPattern = async (pattern) => {
  if (!redisClient) {
    logger.warn('delPattern called but redisClient is not initialized');
    return false;
  }

  let cursor = '0';
  try {
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 500);

      if (keys.length) {
        await redisClient.unlink(...keys);
      }
      cursor = nextCursor;
    } while (cursor !== '0');

    logger.info(`delPattern completed successfully`, { pattern });
    return true;
  } catch (error) {
    logger.error('delPattern failed', { pattern, message: error.message });
    return false;
  }
};
