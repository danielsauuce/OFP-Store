/**
 * Product Routes — Integration Tests (Supertest)
 *
 * Product listing (GET /api/product) and detail (GET /api/product/:id)
 * are public routes — no auth required. They go through helmet,
 * mongo-sanitize, rate limiter, and the cache middleware.
 */
import './setup.js';
import request from 'supertest';
import app from '../../app.js';
import { adminToken, customerToken, authHeader } from './helpers.js';

/* ── Mock models & external deps ──────────────────────────── */
jest.mock('../../models/user.js');
jest.mock('../../models/refreshToken.js');
jest.mock('../../models/product.js');
jest.mock('../../models/category.js');
jest.mock('../../models/media.js');
jest.mock('../../models/cart.js');
jest.mock('../../models/order.js');
jest.mock('../../models/ticket.js');
jest.mock('../../models/wishlist.js');
jest.mock('../../models/review.js');
jest.mock('../../models/payment.js');
jest.mock('../../utils/generateToken.js');
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

import Product from '../../models/product.js';
import Category from '../../models/category.js';
import Media from '../../models/media.js';

beforeEach(() => jest.clearAllMocks());

/* ═══════════════════════════════════════════════════════════ */
describe('GET /api/product (public)', () => {
  test('returns product listing without auth', async () => {
    const mockProducts = [
      {
        _id: 'prod-1',
        name: 'Modern Sofa',
        price: 499,
        category: { name: 'Living Room' },
        primaryImage: { secureUrl: 'https://cdn.test.com/sofa.jpg' },
      },
    ];

    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      }),
    });
    jest.mock('../../config/sublyzerProxy.js', () => ({
      sublyzerProxy: jest.fn((req, res) => res.status(200).json({ ok: true })),
    }));
    Product.countDocuments.mockResolvedValue(1);

    // Media/Category resolution mocks (resolveProductRefs)
    Media.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    Category.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const res = await request(app).get('/api/product');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Modern Sofa');
  });

  test('supports pagination query params', async () => {
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    Product.countDocuments.mockResolvedValue(0);

    const res = await request(app).get('/api/product?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('GET /api/product/:id (public)', () => {
  test('returns 404 for non-existent product', async () => {
    Product.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get('/api/product/665000000000000000000099');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('Admin product routes', () => {
  test('POST /api/admin/products/create returns 403 for customer', async () => {
    const res = await request(app)
      .post('/api/admin/products/create')
      .set('Authorization', authHeader(customerToken()))
      .send({ name: 'New Product' });

    expect(res.status).toBe(403);
  });

  test('POST /api/admin/products/create returns 401 without token', async () => {
    const res = await request(app).post('/api/admin/products/create').send({ name: 'New Product' });

    expect(res.status).toBe(401);
  });
});
