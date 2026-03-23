/**
 * Cart Routes — Integration Tests (Supertest)
 *
 * Verifies that cart endpoints work correctly through the
 * full middleware chain with a valid JWT.
 */
import '../setup.js';
import request from 'supertest';
import app from '../../app.js';
import { customerToken, authHeader } from '../helpers.js';

/* ── Mock models & external deps ──────────────────────────── */
jest.mock('../../models/user.js');
jest.mock('../../models/refreshToken.js');
jest.mock('../../models/cart.js');
jest.mock('../../models/product.js');
jest.mock('../../models/category.js');
jest.mock('../../models/media.js');
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

import Cart from '../../models/cart.js';
import Product from '../../models/product.js';

const token = customerToken();

beforeEach(() => jest.clearAllMocks());

/* ═══════════════════════════════════════════════════════════ */
describe('GET /api/cart', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  test('returns empty cart when none exists', async () => {
    Cart.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    Cart.create.mockResolvedValue({
      _id: 'new-cart-id',
      items: [],
    });

    const res = await request(app).get('/api/cart').set('Authorization', authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.cart.items).toEqual([]);
    expect(res.body.cart.total).toBe(0);
  });

  test('returns existing cart with computed total', async () => {
    const mockCart = {
      _id: 'cart-1',
      items: [
        { product: { name: 'Sofa' }, quantity: 2, priceSnapshot: 500 },
        { product: { name: 'Lamp' }, quantity: 1, priceSnapshot: 80 },
      ],
    };
    Cart.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCart),
      }),
    });

    const res = await request(app).get('/api/cart').set('Authorization', authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.cart.total).toBe(1080); // (500*2) + (80*1)
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('POST /api/cart/items', () => {
  test('returns 400 with invalid body', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 404 when product not found', async () => {
    Product.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader(token))
      .send({ product: '665000000000000000000010', quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('returns 200 when adding a valid product', async () => {
    Product.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '665000000000000000000010',
        name: 'Modern Sofa',
        price: 499,
        isActive: true,
        stockQuantity: 10,
        variants: [],
      }),
    });

    const mockCart = {
      _id: 'cart-1',
      user: '665000000000000000000001',
      items: [],
      total: 499,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    mockCart.items.push = jest.fn();

    Cart.findOne.mockResolvedValue(mockCart);

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', authHeader(token))
      .send({ product: '665000000000000000000010', quantity: 1 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('DELETE /api/cart', () => {
  test('clears cart successfully', async () => {
    Cart.findOneAndUpdate.mockResolvedValue({
      _id: 'cart-1',
      items: [],
    });

    const res = await request(app).delete('/api/cart').set('Authorization', authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cleared/i);
  });
});
