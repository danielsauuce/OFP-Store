import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
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
import { sublyzerProxy } from './config/sublyzerProxy.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors(corsOptions));

app.use('/sublyzer', sublyzerProxy);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize all incoming input to prevent NoSQL injection
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  next();
});

// Rate limit middleware
app.use(rateLimiterMiddleware);

// Routes
app.use('/api/auth/', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/admin/product', adminRoutes);
app.use('/api/media/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.use(errorHandler);

export default app;
