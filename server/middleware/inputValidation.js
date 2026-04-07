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
    // Prevent dangerous keys (prototype pollution)
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error('Dangerous property detected');
    }

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      // Only check for very obvious command execution patterns
      // Allow alphanumeric, common special chars, and URLs
      if (
        /(^|\s)(eval|exec|spawn|chmod|rm|rmdir|dd|mkfs|mount|sh|bash|cmd|powershell)\s*\(/.test(
          value
        )
      ) {
        throw new Error('Suspicious command pattern detected');
      }

      // Check for shell metacharacters used in dangerous context (e.g., "; command")
      if (/;\s*(\/bin\/|\/usr\/|cmd\.exe|powershell)/.test(value)) {
        throw new Error('Suspicious shell command detected');
      }
    } else if (typeof value === 'object' && value !== null) {
      validateObject(value, depth + 1);
    }
  }
}
