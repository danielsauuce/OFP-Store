/**
 * Wishlist & Order Routes — Integration Tests (Supertest)
 *
 * Both are fully protected (require auth). Orders also have
 * admin-only sub-routes.
 */
import './setup.js';
import request from 'supertest';
import app from '../../app.js';
import { customerToken, adminToken, authHeader } from './helpers.js';

/* ── Mock models & external deps ──────────────────────────── */
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
jest.mock('../../models/cart.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/product.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/category.js', () => ({ default: mockModelFactory(), __esModule: true }));
jest.mock('../../models/media.js', () => ({ default: mockModelFactory(), __esModule: true }));
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

import Wishlist from '../../models/wishlist.js';
import Order from '../../models/order.js';

const token = customerToken();

beforeEach(() => jest.clearAllMocks());

/* ═══════════════════════════════════════════════════════════ */
describe('Wishlist routes', () => {
  test('GET /api/wishlist returns 401 without token', async () => {
    const res = await request(app).get('/api/wishlist');
    expect(res.status).toBe(401);
  });
  jest.mock('../../config/sublyzerProxy.js', () => ({
    sublyzerProxy: jest.fn((req, res) => res.status(200).json({ ok: true })),
  }));

  test('GET /api/wishlist returns wishlist for authenticated user', async () => {
    Wishlist.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: 'wl-1',
          products: [{ _id: 'prod-1', name: 'Sofa' }],
        }),
      }),
    });

    const res = await request(app).get('/api/wishlist').set('Authorization', authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/wishlist returns 401 without token', async () => {
    const res = await request(app).post('/api/wishlist').send({ productId: 'prod-1' });
    expect(res.status).toBe(401);
  });

  test('DELETE /api/wishlist returns 401 without token', async () => {
    const res = await request(app).delete('/api/wishlist');
    expect(res.status).toBe(401);
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('Order routes', () => {
  test('GET /api/orders returns 401 without token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  test('POST /api/orders returns 401 without token', async () => {
    const res = await request(app).post('/api/orders').send({});
    expect(res.status).toBe(401);
  });

  test('GET /api/orders returns user orders with valid token', async () => {
    // Controller chains: .populate().populate().sort().skip().limit() (no .lean())
    const mockOrders = [{ _id: 'order-1', orderStatus: 'processing' }];
    const chain = { populate: jest.fn(), sort: jest.fn(), skip: jest.fn(), limit: jest.fn() };
    chain.populate.mockReturnValue(chain);
    chain.sort.mockReturnValue(chain);
    chain.skip.mockReturnValue(chain);
    chain.limit.mockResolvedValue(mockOrders);
    Order.find.mockReturnValue(chain);
    Order.countDocuments.mockResolvedValue(1);

    const res = await request(app).get('/api/orders').set('Authorization', authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  /* ── Admin order routes ─────────────────────────────────── */
  test('GET /api/orders/admin returns 403 for customer', async () => {
    const res = await request(app)
      .get('/api/orders/admin')
      .set('Authorization', authHeader(customerToken()));

    expect(res.status).toBe(403);
  });

  test('GET /api/orders/admin returns 401 without token', async () => {
    const res = await request(app).get('/api/orders/admin');
    expect(res.status).toBe(401);
  });
});
