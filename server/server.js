import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import dbConnection from './config/db.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 3000;

dbConnection();

app.listen(PORT, () => {
  logger.info(`Server is running on PORT ${PORT}`);
  console.log(`Server is running on PORT ${PORT}`);
});
