import dotenv from 'dotenv';
dotenv.config();

import { Redis } from '@upstash/redis';
import logger from '../utils/logger.js';

let redisClient;

try {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  logger.info('Upstash Redis client initialized');
} catch (error) {
  logger.error('Failed to initialize Upstash Redis:', { error: error.message });
  redisClient = null;
}

export const cacheHelpers = {
  get: async (key) => {
    try {
      if (!redisClient) return null;
      return await redisClient.get(key);
    } catch (error) {
      logger.error('Redis GET error:', { key, error: error.message });
      return null;
    }
  },
  set: async (key, value, expirationSeconds = 3600) => {
    try {
      if (!redisClient) return false;
      await redisClient.set(key, value, { ex: expirationSeconds });
      return true;
    } catch (error) {
      logger.error('Redis SET error:', { key, error: error.message });
      return false;
    }
  },
  del: async (key) => {
    try {
      if (!redisClient) return false;
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', { key, error: error.message });
      return false;
    }
  },
  delPattern: async (pattern) => {
    try {
      if (!redisClient) return false;
      const keys = await redisClient.keys(pattern);
      if (keys.length) await redisClient.del(...keys);
      return true;
    } catch (error) {
      logger.error('Redis DEL PATTERN error:', { pattern, error: error.message });
      return false;
    }
  },
  exists: async (key) => {
    try {
      if (!redisClient) return false;
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', { key, error: error.message });
      return false;
    }
  },
  ttl: async (key) => {
    try {
      if (!redisClient) return -1;
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error:', { key, error: error.message });
      return -1;
    }
  },
};

export default redisClient;
