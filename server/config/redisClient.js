export const delPattern = async (pattern) => {
  if (!redisClient) {
    logger.warn('delPattern called but redisClient is not initialized');
    return false;
  }

  let cursor = '0';

  try {
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, {
        match: pattern,
        count: 500,
      });

      if (keys.length) {
        // Prefer UNLINK (non-blocking), fallback to DEL
        if (typeof redisClient.unlink === 'function') {
          await redisClient.unlink(...keys);
        } else {
          await redisClient.del(...keys);
        }
      }

      cursor = nextCursor;
    } while (cursor !== '0');

    logger.info(`delPattern completed successfully`, { pattern });
    return true;
  } catch (error) {
    logger.error('delPattern failed', {
      pattern,
      message: error.message,
      stack: error.stack,
    });

    return false;
  }
};
