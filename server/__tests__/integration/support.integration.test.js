/**
 * Support Routes — Integration Tests (Supertest)
 *
 * The support/ticket system has a unique access pattern:
 * - POST /api/support (create ticket) is PUBLIC
 * - GET  /api/support/my-tickets requires authentication
 * - Admin endpoints require both auth + admin role
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

import Ticket from '../../models/ticket.js';

beforeEach(() => jest.clearAllMocks());

/* ═══════════════════════════════════════════════════════════ */
describe('POST /api/support (public ticket creation)', () => {
  test('returns 400 with invalid body', async () => {
    const res = await request(app).post('/api/support').send({});
    jest.mock('../../config/sublyzerProxy.js', () => ({
      sublyzerProxy: jest.fn((req, res) => res.status(200).json({ ok: true })),
    }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 201 with valid ticket data (no auth)', async () => {
    Ticket.create.mockResolvedValue({
      _id: 'ticket-1',
      subject: 'Order Issue',
      message: 'My order has not arrived',
      status: 'new',
    });

    const res = await request(app).post('/api/support').send({
      name: 'Daniel',
      email: 'dan@test.com',
      subject: 'Order Issue',
      message: 'My order has not arrived and I need help tracking it.',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.ticketId).toBe('ticket-1');
  });

  test('returns 201 with valid ticket data (authenticated user)', async () => {
    Ticket.create.mockResolvedValue({
      _id: 'ticket-2',
      subject: 'Return Request',
      status: 'new',
    });

    const res = await request(app)
      .post('/api/support')
      .set('Authorization', authHeader(customerToken()))
      .send({
        subject: 'Return Request',
        message: 'I would like to return the sofa I ordered last week.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('GET /api/support/my-tickets (authenticated)', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/support/my-tickets');
    expect(res.status).toBe(401);
  });

  test('returns user tickets with valid token', async () => {
    Ticket.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue([{ _id: 'ticket-1', subject: 'Order Issue', status: 'open' }]),
        }),
      }),
    });

    const res = await request(app)
      .get('/api/support/my-tickets')
      .set('Authorization', authHeader(customerToken()));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tickets).toHaveLength(1);
    expect(res.body.tickets[0].subject).toBe('Order Issue');
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('Admin support endpoints', () => {
  test('GET /api/support/admin returns 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/support/admin')
      .set('Authorization', authHeader(customerToken()));

    expect(res.status).toBe(403);
  });

  test('GET /api/support/admin returns tickets for admin', async () => {
    Ticket.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValue([{ _id: 'ticket-1', subject: 'Issue', status: 'new' }]),
              }),
            }),
          }),
        }),
      }),
    });
    Ticket.countDocuments.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/support/admin')
      .set('Authorization', authHeader(adminToken()));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tickets).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });
});
