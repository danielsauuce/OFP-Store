import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import dbConnection from './config/db.js';
import logger from './utils/logger.js';
import { initSocket } from './socket/index.js';
import corsOptions from './config/corsOptions.js';

const PORT = process.env.PORT || 3000;

dbConnection();

const httpServer = http.createServer(app);

initSocket(httpServer, corsOptions);

httpServer.listen(PORT, () => {
  logger.info(`Server is running on PORT ${PORT}`);
  console.log(`Server is running on PORT ${PORT}`);
});
