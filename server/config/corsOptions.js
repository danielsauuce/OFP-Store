const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const allowedOrigins = clientUrl.split(',').map((url) => url.trim());

    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:3000');
      allowedOrigins.push('http://localhost:5173');
      allowedOrigins.push('http://127.0.0.1:3000');
      allowedOrigins.push('http://127.0.0.1:5173');
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const safeOrigin = String(origin).replace(/[\r\n]/g, '');
      callback(new Error(`CORS blocked: ${safeOrigin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

export default corsOptions;
