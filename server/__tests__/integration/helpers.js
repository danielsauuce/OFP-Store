/**
 * Integration test helpers
 *
 * Provides JWT token generation and reusable test data
 * for Supertest integration tests.
 */
import jwt from 'jsonwebtoken';

// A fixed secret used across all integration tests.
// Must match process.env.JWT_SECRET set in setup.js.
export const TEST_JWT_SECRET = 'integration-test-secret';

/**
 * Generate a valid JWT access token for a test user.
 * The payload mirrors what generateTokens() in utils/generateToken.js produces.
 */
export const generateTestToken = (overrides = {}) => {
  const payload = {
    userId: overrides.userId || '665000000000000000000001',
    username: overrides.username || 'Test User',
    role: overrides.role || 'customer',
    ...overrides,
  };

  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });
};

/** Pre-built tokens for common roles */
export const customerToken = () => generateTestToken({ role: 'customer' });
export const adminToken = () =>
  generateTestToken({
    userId: '665000000000000000000099',
    username: 'Admin User',
    role: 'admin',
  });

/** Standard auth header helper */
export const authHeader = (token) => `Bearer ${token}`;
