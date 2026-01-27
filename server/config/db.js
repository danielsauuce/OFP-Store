import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB connected successfully');
    console.log('MongoDB connected successfully');
  } catch (error) {
    logger.warn('MongoDB connection failed');
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default dbConnection;
