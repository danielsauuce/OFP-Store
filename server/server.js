import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import dbConnection from './config/db.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';
import helmet from 'helmet';
import cors from 'cors';
import corsOptions from './config/corsOptions.js';
import authRoutes from './routes/authRoutes.js';
import rateLimiterMiddleware from './middleware/rateLimiter.js';
import productRoutes from './routes/productRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

dbConnection();

// Middleware
app.use(helmet());

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.body = mongoSanitize.sanitize(req.body);
  next();
});

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Rate limit middleware
app.use(rateLimiterMiddleware);

// Routes
app.use('/api/auth/', authRoutes);
app.use('/api/product', productRoutes); // routes fetch products for both admin and user
app.use('/api/admin/product', adminRoutes); // routes fetch products for admin only
app.use('/api/media/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes); // for user management in admin routes
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on PORT ${PORT}`);
  console.log(`Server is running on PORT ${PORT}`);
});
