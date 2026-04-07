/**
 * Middleware to enforce HTTPS in production
 */
export const httpsRedirect = (req, res, next) => {
  // Skip HTTPS redirect for local development or when NODE_ENV is not explicitly set to production
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

  if (!isProduction || isLocalhost) {
    return next();
  }

  // Check if the request is already HTTPS or has X-Forwarded-Proto header (for proxies/load balancers)
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (!isSecure) {
    const url = `https://${req.headers.host}${req.url}`;
    return res.redirect(301, url);
  }

  next();
};
