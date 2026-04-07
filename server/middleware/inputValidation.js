import logger from '../utils/logger.js';

/**
 * Middleware to validate and sanitize user input to prevent injection attacks
 */
export const validateInput = (req, res, next) => {
  try {
    // Validate request body
    if (req.body && typeof req.body === 'object') {
      validateObject(req.body);
    }

    // Validate query parameters
    if (req.query && typeof req.query === 'object') {
      validateObject(req.query);
    }

    // Validate URL parameters
    if (req.params && typeof req.params === 'object') {
      validateObject(req.params);
    }

    next();
  } catch (error) {
    logger.warn('Input validation failed', { error: error.message });
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
    });
  }
};

/**
 * Recursively validate object values to prevent command injection
 */
function validateObject(obj, depth = 0) {
  if (depth > 10) {
    throw new Error('Maximum nesting depth exceeded');
  }

  for (const [key, value] of Object.entries(obj)) {
    // Prevent dangerous keys
    if (key.includes('__proto__') || key.includes('constructor') || key.includes('prototype')) {
      throw new Error('Dangerous property detected');
    }

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      // Check for command injection patterns
      if (
        /[;&|`$()\[\]\{\}<>]|\/bin\/|\/usr\/|cmd\.exe|powershell|bash|sh|exec|spawn|eval|require|import/.test(
          value
        )
      ) {
        throw new Error('Suspicious pattern detected in string value');
      }
    } else if (typeof value === 'object' && value !== null) {
      validateObject(value, depth + 1);
    }
  }
}
