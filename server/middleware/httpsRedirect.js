/**
 * Middleware to enforce HTTPS in production
 */
export const httpsRedirect = (req, res, next) => {
  // Skip HTTPS redirect for local development
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
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
