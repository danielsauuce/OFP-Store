import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import errorHandler from './middleware/errorHandler.js';
import helmet from 'helmet';
import cors from 'cors';
import corsOptions from './config/corsOptions.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { validateInput } from './middleware/inputValidation.js';
import { httpsRedirect } from './middleware/httpsRedirect.js';
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
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import { sublyzerProxy } from './config/sublyzerProxy.js';
import { httpRequestDuration, httpRequestsTotal, register } from './config/prometheus.js';

const app = express();

// Middleware
app.use(httpsRedirect);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xContentTypeOptions: true,
    xFrameOptions: { action: 'deny' },
    xPoweredBy: false,
  }),
);
app.use(securityHeaders);
app.use(cors(corsOptions));

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validate input to prevent injection attacks
app.use(validateInput);

// Sublyzer proxy
app.use('/sublyzer', sublyzerProxy);

// Sanitize all incoming input to prevent NoSQL injection
app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  next();
});

// Rate limit middleware
app.use(rateLimiterMiddleware);

// Prometheus metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? (req.baseUrl || '') + req.route.path : 'unmatched';
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  next();
});

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
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

// Prometheus metrics endpoint - protect from public access
app.get(
  '/metrics',
  (request, res, next) => {
    const metricsToken = process.env.METRICS_AUTH_TOKEN;
    if (metricsToken) {
      const authHeader = request.headers.authorization || '';
      if (authHeader !== `Bearer ${metricsToken}`) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    }
    next();
  },
  async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error.message);
    }
  },
);

app.use(errorHandler);

export default app;
