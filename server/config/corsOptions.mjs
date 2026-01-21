const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CLIENT_URL.split(',');

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const safeOrigin = String(origin ?? 'unknown').replace(/[\r\n]/g, '');
      callback(new Error(`CORS blocked: ${safeOrigin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default corsOptions;
