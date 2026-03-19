const allowedOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : [];

const corsOptions = {
  origin: (origin, callback) => {
    // for mobile app
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('Blocked by CORS:', origin);
    return callback(new Error(`CORS blocked: ${origin}`));
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default corsOptions;
