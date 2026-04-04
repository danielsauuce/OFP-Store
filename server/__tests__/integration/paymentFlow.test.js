/**
 * Payment Flow — Integration Tests (Supertest)
 *
 * Verifies that payment endpoints respond correctly through
 * the full middleware chain.
 */
import './setup.js';
import request from 'supertest';
import app from '../../app.js';
import { customerToken, authHeader } from './helpers.js';

/* ── Mock models & external deps ──────────────────────────── */
function mockModelFactory() {
  return {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOneAndUpdate: jest.fn(),
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
jest.mock('../../models/notification.js', () => ({
  default: mockModelFactory(),
  __esModule: true,
}));
jest.mock('../../models/chatMessage.js', () => ({
  default: mockModelFactory(),
  __esModule: true,
}));
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
jest.mock('../../config/sublyzerProxy.js', () => ({
  sublyzerProxy: jest.fn((_req, res) => res.status(200).json({ ok: true })),
}));
jest.mock('../../config/prometheus.js', () => ({
  httpRequestDuration: { startTimer: jest.fn(() => jest.fn()), observe: jest.fn() },
  httpRequestsTotal: { inc: jest.fn() },
  register: { contentType: 'text/plain', metrics: jest.fn().mockResolvedValue('') },
}));

const mockCreatePaymentIntent = jest.fn();
const mockConstructWebhookEvent = jest.fn();
const mockRetrievePaymentIntent = jest.fn();

jest.mock('../../services/stripeService.js', () => ({
  createPaymentIntent: (...args) => mockCreatePaymentIntent(...args),
  constructWebhookEvent: (...args) => mockConstructWebhookEvent(...args),
  retrievePaymentIntent: (...args) => mockRetrievePaymentIntent(...args),
  __esModule: true,
}));

import Order from '../../models/order.js';
import Payment from '../../models/payment.js';

const token = customerToken();

beforeEach(() => jest.clearAllMocks());

/* ═══════════════════════════════════════════════════════════ */
describe('POST /api/payments/create-payment-intent', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .send({ orderId: 'a'.repeat(24) });

    expect(res.status).toBe(401);
  });

  test('returns 400 when orderId is missing', async () => {
    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', authHeader(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 404 when order not found', async () => {
    Order.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', authHeader(token))
      .send({ orderId: 'a'.repeat(24) });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('returns 200 with clientSecret when order exists', async () => {
    Order.findOne.mockResolvedValue({
      _id: 'a'.repeat(24),
      orderNumber: 'ORD-001',
      total: 150,
      paymentStatus: 'pending',
    });
    mockCreatePaymentIntent.mockResolvedValue({
      id: 'pi_test123',
      client_secret: 'pi_test123_secret',
    });
    Payment.findOneAndUpdate.mockResolvedValue({ order: 'a'.repeat(24) });

    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', authHeader(token))
      .send({ orderId: 'a'.repeat(24) });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.clientSecret).toBe('pi_test123_secret');
  });

  test('returns 400 when order is already paid', async () => {
    Order.findOne.mockResolvedValue({
      _id: 'a'.repeat(24),
      orderNumber: 'ORD-002',
      total: 100,
      paymentStatus: 'paid',
    });

    const res = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', authHeader(token))
      .send({ orderId: 'a'.repeat(24) });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Order is already paid');
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('POST /api/payments/confirm-success', () => {
  test('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/payments/confirm-success')
      .send({ stripePaymentIntentId: 'pi_test123' });

    expect(res.status).toBe(401);
  });

  test('returns 400 when stripePaymentIntentId is missing', async () => {
    const res = await request(app)
      .post('/api/payments/confirm-success')
      .set('Authorization', authHeader(token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when Stripe reports payment not succeeded', async () => {
    mockRetrievePaymentIntent.mockResolvedValue({ id: 'pi_test', status: 'processing' });

    const res = await request(app)
      .post('/api/payments/confirm-success')
      .set('Authorization', authHeader(token))
      .send({ stripePaymentIntentId: 'pi_test' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Payment not confirmed by Stripe');
  });

  test('returns 400 when Stripe returns null intent', async () => {
    mockRetrievePaymentIntent.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/payments/confirm-success')
      .set('Authorization', authHeader(token))
      .send({ stripePaymentIntentId: 'pi_invalid' });

    expect(res.status).toBe(400);
  });

  test('returns 200 and updates Payment and Order when Stripe confirms succeeded', async () => {
    mockRetrievePaymentIntent.mockResolvedValue({
      id: 'pi_success123',
      status: 'succeeded',
      metadata: { orderId: 'b'.repeat(24) },
    });
    Payment.findOneAndUpdate.mockResolvedValue({ status: 'succeeded' });
    Order.findOneAndUpdate.mockResolvedValue({ paymentStatus: 'paid' });

    const res = await request(app)
      .post('/api/payments/confirm-success')
      .set('Authorization', authHeader(token))
      .send({ stripePaymentIntentId: 'pi_success123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      { stripePaymentIntentId: 'pi_success123' },
      { status: 'succeeded' },
    );
    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'b'.repeat(24) },
      { paymentStatus: 'paid' },
    );
  });

  test('still returns 200 when orderId is missing from metadata', async () => {
    mockRetrievePaymentIntent.mockResolvedValue({
      id: 'pi_nometa',
      status: 'succeeded',
      metadata: {},
    });
    Payment.findOneAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .post('/api/payments/confirm-success')
      .set('Authorization', authHeader(token))
      .send({ stripePaymentIntentId: 'pi_nometa' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('POST /api/payments/webhook', () => {
  test('handles payment_intent.succeeded and updates order paymentStatus to paid', async () => {
    const fakeEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test456',
          metadata: { orderId: 'b'.repeat(24) },
        },
      },
    };
    mockConstructWebhookEvent.mockReturnValue(fakeEvent);
    Payment.findOneAndUpdate.mockResolvedValue({});
    Order.findOneAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 't=123,v1=abc')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'payment_intent.succeeded' }));

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'b'.repeat(24) },
      { paymentStatus: 'paid' },
    );
  });

  test('returns 400 when webhook signature verification fails', async () => {
    mockConstructWebhookEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature');
    });

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'bad-sig')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({}));

    expect(res.status).toBe(400);
    // Controller returns { error: 'invalid_webhook_signature' } on bad sig
    expect(res.body.error).toBe('invalid_webhook_signature');
  });
});
