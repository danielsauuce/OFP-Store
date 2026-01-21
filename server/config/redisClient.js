import dotenv from 'dotenv';
dotenv.config();

import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import logger from '../utils/logger.js';

let redisClient;
let rateLimiter;

try {
  const connectionString = process.env.REDIS_URi;
  if (!connectionString) {
    throw new Error('REDIS_URL environment variable is not set.');
  }

  redisClient = new Redis(connectionString, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      logger.info(`Redis retry attempt ${times} after ${delay}ms`);
      return delay;
    },

    tls: {
      rejectUnauthorized: false,
      servername: new URL(connectionString).hostname,
    },

    keepAlive: 10000,
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected successfully to Upstash');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', {
      message: err.message || 'Unknown error',
      stack: err.stack,
      code: err.code,
    });
  });

  redisClient.on('ready', () => {
    logger.info('Redis client is ready and authenticated');
  });

  rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10, // 10 requests
    duration: 60, // per 60 seconds
    blockDuration: 60, // block for 60s on exceed
  });

  logger.info('Rate limiter initialized with Upstash Redis');
} catch (error) {
  logger.error('Failed to initialize Redis/Rate Limiter:', {
    message: error.message,
    stack: error.stack,
  });

  rateLimiter = null;
}

export default { redisClient, rateLimiter };
