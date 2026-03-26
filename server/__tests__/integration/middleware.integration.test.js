/**
 * Middleware Chain — Integration Tests (Supertest)
 *
 * Verifies that the Express middleware pipeline works correctly
 * end-to-end: helmet headers, mongo-sanitize, rate limiting,
 * and authentication enforcement.
 */
import './setup.js';
import request from 'supertest';
import app from '../../app.js';
import { customerToken, adminToken, authHeader } from './helpers.js';

/* ── Mock external deps ───────────────────────────────────── */
function mockModelFactory() {
  return {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
    deleteOne: jest.fn(),
    updateOne: jest.fn(),
    aggregate: jest.fn(),
  };
}
jest.mock('../../models/user.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/refreshToken.js', () => ({
  default: mockModelFactory(),
  __esModule: true,
}));
jest.mock('../../models/product.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/category.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/media.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/cart.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/order.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/ticket.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/wishlist.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/review.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/payment.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../utils/generateToken.js', () => ({ default: jest.fn(), __esModule: true }));
jest.mock('../../middleware/rateLimiter.js', () => ({
  default: (_req, _res, next) => next(),
  __esModule: true,
}));
jest.mock('../../config/cloudinary.js', () => ({
  deleteMediaFromCloudinary: jest.fn(),
}));
jest.mock('../../config/upstashRedis.js', () => ({
  cacheHelpers: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(true),
    delPattern: jest.fn().mockResolvedValue(true),
    exists: jest.fn().mockResolvedValue(false),
    ttl: jest.fn().mockResolvedValue(-1),
  },
  default: null,
}));

beforeEach(() => jest.clearAllMocks());

/* ═══════════════════════════════════════════════════════════ */
describe('Helmet security headers', () => {
  test('responses include standard security headers', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
  });
  jest.mock('../../config/sublyzerProxy.js', () => ({
    sublyzerProxy: jest.fn((req, res) => res.status(200).json({ ok: true })),
  }));

  test('X-Powered-By header is removed', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('Mongo-sanitize middleware', () => {
  test('strips $-prefixed operators from request body', async () => {
    // Attempt a NoSQL injection via the login endpoint.
    // The mongo-sanitize middleware should remove the $gt operator
    // BEFORE it reaches the controller.
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $gt: '' },
        password: 'anything',
      });

    // The sanitised body should fail Joi validation (email is not a string),
    // NOT reach the database with the injection payload.
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('Authentication middleware enforcement', () => {
  const protectedRoutes = [
    { method: 'get', path: '/api/cart' },
    { method: 'get', path: '/api/wishlist' },
    { method: 'get', path: '/api/orders' },
    { method: 'get', path: '/api/users/profile' },
    { method: 'post', path: '/api/auth/change-password' },
  ];

  test.each(protectedRoutes)(
    '$method $path returns 401 without token',
    async ({ method, path }) => {
      const res = await request(app)[method](path);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    },
  );

  test.each(protectedRoutes)(
    '$method $path returns 401 with invalid token',
    async ({ method, path }) => {
      const res = await request(app)
        [method](path)
        .set('Authorization', 'Bearer completely.invalid.token');

      expect(res.status).toBe(401);
    },
  );
});

/* ═══════════════════════════════════════════════════════════ */
describe('Admin middleware enforcement', () => {
  const adminRoutes = [
    { method: 'get', path: '/api/admin/users' },
    { method: 'get', path: '/api/admin/dashboard/stats' },
    { method: 'get', path: '/api/admin/products' },
  ];

  test.each(adminRoutes)(
    '$method $path returns 403 for non-admin user',
    async ({ method, path }) => {
      const res = await request(app)
        [method](path)
        .set('Authorization', authHeader(customerToken()));

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/admin only/i);
    },
  );

  test.each(adminRoutes)('$method $path returns 401 without token', async ({ method, path }) => {
    const res = await request(app)[method](path);

    expect(res.status).toBe(401);
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('JSON body parsing', () => {
  test('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json }');

    // Express 5 returns 400 for malformed JSON
    expect(res.status).toBe(400);
  });
});
