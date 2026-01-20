import arcjet, { shield, tokenBucket, detectBot } from '@arcjet/node';

// Initialize Arcjet
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip'],
  rules: [
    shield({
      mode: 'LIVE',
    }),
  ],
});

// Arcjet protection rules
export const arcjetRules = {
  // Registration endpoint protection
  registration: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 2,
      interval: '1h',
      capacity: 5,
    }),
    detectBot({
      mode: 'LIVE',
      allow: [],
    }),
  ),

  // Login endpoint protection
  login: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5,
      interval: '15m',
      capacity: 10,
    }),
    detectBot({
      mode: 'LIVE',
      allow: ['CATEGORY:SEARCH_ENGINE'],
    }),
  ),

  // Password change protection
  passwordChange: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 2,
      interval: '1h',
      capacity: 3,
    }),
  ),

  // Auth check protection
  authCheck: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 100,
      interval: '1m',
      capacity: 100,
    }),
  ),

  // Forgot password protection
  forgotPassword: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 2,
      interval: '1h',
      capacity: 3,
    }),
    detectBot({
      mode: 'LIVE',
      allow: [],
    }),
  ),

  // Reset password protection
  resetPassword: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 3,
      interval: '1h',
      capacity: 5,
    }),
  ),

  // General API protection for other endpoints
  general: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 60,
      interval: '1m',
      capacity: 100,
    }),
  ),
};

// Helper function to handle Arcjet decisions
export const handleArcjetDecision = (decision, logger, context = '') => {
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      logger.warn(`Rate limit exceeded: ${context}`, { ip: decision.ip });
      return {
        status: 429,
        response: {
          success: false,
          message: 'Too many requests. Please try again later.',
        },
      };
    }

    if (decision.reason.isBot()) {
      logger.warn(`Bot detected: ${context}`, { ip: decision.ip });
      return {
        status: 403,
        response: {
          success: false,
          message: 'Bot detected. Request denied.',
        },
      };
    }

    if (decision.reason.isShield()) {
      logger.warn(`Shield blocked request: ${context}`, { ip: decision.ip });
      return {
        status: 403,
        response: {
          success: false,
          message: 'Suspicious activity detected. Request denied.',
        },
      };
    }

    logger.warn(`Request denied by Arcjet: ${context}`, {
      ip: decision.ip,
      reason: decision.reason,
    });
    return {
      status: 403,
      response: {
        success: false,
        message: 'Request denied.',
      },
    };
  }

  return null; // Request is allowed
};

export default aj;
