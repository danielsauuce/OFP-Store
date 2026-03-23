/**
 * Auth Routes — Integration Tests (Supertest)
 *
 * These tests send real HTTP requests through the Express app.
 * Mongoose models are mocked so no database is needed, but
 * every middleware (helmet, CORS, mongo-sanitize, rate-limiter,
 * JSON parsing, auth middleware) runs for real.
 */
import './setup.js';
import request from 'supertest';
import app from '../../app.js';
import { customerToken, authHeader } from './helpers.js';

/* ── Mock all Mongoose models & external deps ─────────────── */
jest.mock('../../models/user.js');
jest.mock('../../models/refreshToken.js');
jest.mock('../../utils/generateToken.js');
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

import User from '../../models/user.js';
import generateTokens from '../../utils/generateToken.js';

beforeEach(() => jest.clearAllMocks());

/* ═══════════════════════════════════════════════════════════ */
describe('POST /api/auth/register', () => {
  const validBody = {
    fullName: 'Daniel Olayinka',
    email: 'dan@test.com',
    password: 'SecurePass123!',
  };

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    jest.mock('../../config/sublyzerProxy.js', () => ({
      sublyzerProxy: jest.fn((req, res) => res.status(200).json({ ok: true })),
    }));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validBody, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 400 when email already exists', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing-user', email: 'dan@test.com' });

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in use/i);
  });

  test('returns 201 on successful registration', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'new-user-id',
      fullName: 'Daniel Olayinka',
      email: 'dan@test.com',
      role: 'customer',
    });
    generateTokens.mockResolvedValue({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
    });

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBe('access-123');
    expect(res.body.user.email).toBe('dan@test.com');
  });

  test('helmet sets security headers on responses', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: 'id',
      fullName: 'Test',
      email: 'test@test.com',
      role: 'customer',
    });
    generateTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('POST /api/auth/login', () => {
  const validBody = { email: 'dan@test.com', password: 'SecurePass123!' };

  test('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('returns 401 when user is not found', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('returns 401 when password is wrong', async () => {
    const mockUser = {
      _id: 'user-1',
      email: 'dan@test.com',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(false),
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  test('returns 403 when account is deactivated', async () => {
    const mockUser = {
      _id: 'user-1',
      email: 'dan@test.com',
      isActive: false,
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('returns 200 with tokens on successful login', async () => {
    const mockUser = {
      _id: 'user-1',
      fullName: 'Daniel',
      email: 'dan@test.com',
      role: 'customer',
      phone: '123456',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });
    generateTokens.mockResolvedValue({
      accessToken: 'access-tok',
      refreshToken: 'refresh-tok',
    });

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBe('access-tok');
    expect(res.body.user.fullName).toBe('Daniel');
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('Protected auth routes', () => {
  test('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me returns 200 with valid token', async () => {
    const mockUser = {
      _id: '665000000000000000000001',
      fullName: 'Test User',
      email: 'test@test.com',
      role: 'customer',
    };

    User.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser),
        }),
      }),
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', authHeader(customerToken()));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.fullName).toBe('Test User');
  });

  test('POST /api/auth/change-password returns 401 without token', async () => {
    const res = await request(app).post('/api/auth/change-password').send({
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456!',
    });

    expect(res.status).toBe(401);
  });
});
