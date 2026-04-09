import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const toInt = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: toInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 5000),
      socketTimeoutMS: toInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 45000),
      maxPoolSize: toInt(process.env.MONGO_MAX_POOL_SIZE, 10),
    });
    logger.info('MongoDB connected successfully');
    console.log('MongoDB connected successfully');
  } catch (error) {
    logger.warn('MongoDB connection failed');
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default dbConnection;
