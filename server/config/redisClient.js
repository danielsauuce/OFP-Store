import { Redis } from 'ioredis';
import logger from '../utils/logger.js';
import { RateLimiterRedis } from 'rate-limiter-flexible';

export const redisClient = new Redis(process.env.REDIS_URI, {
  tls: {},
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

redisClient.on('connect', () => logger.info('Redis (ioredis) connected'));
redisClient.on('error', (err) => logger.error('Redis (ioredis) error', { message: err.message }));

export const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,
  duration: 1,
});

export const delPattern = async (pattern) => {
  if (!redisClient) return false;

  let cursor = '0';
  try {
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
      if (keys.length) await redisClient.unlink(...keys);
      cursor = nextCursor;
    } while (cursor !== '0');

    logger.info(`delPattern completed successfully`, { pattern });
    return true;
  } catch (error) {
    logger.error('delPattern failed', { pattern, message: error.message });
    return false;
  }
};
