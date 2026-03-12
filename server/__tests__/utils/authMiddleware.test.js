import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/checkAuthMiddleware.js';

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

const createToken = (payload, options = {}) =>
  jwt.sign(payload, TEST_SECRET, { expiresIn: '1h', ...options });

// Tests for authenticate middleware
describe('authenticate middleware', () => {
  test('returns 401 when no authorization header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'User is not authenticated',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when authorization header has no token after "Bearer "', () => {
    const req = { headers: { authorization: 'Bearer ' } };
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when authorization header is just a random string', () => {
    const req = { headers: { authorization: 'NotBearer' } };
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    // "NotBearer".split(' ')[1] is undefined → should hit the !token check
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next and sets req.user for valid token', () => {
    const payload = { userId: 'user123', username: 'Daniel', role: 'customer' };
    const token = createToken(payload);

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(
      expect.objectContaining({
        id: 'user123',
        username: 'Daniel',
        role: 'customer',
      }),
    );
    expect(res.status).not.toHaveBeenCalled();
  });

  test('sets correct role from token payload', () => {
    const token = createToken({ userId: 'admin1', username: 'Admin', role: 'admin' });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(req.user.role).toBe('admin');
  });

  test('returns 401 for expired token', () => {
    const token = createToken(
      { userId: 'user1', username: 'Dan', role: 'customer' },
      { expiresIn: '0s' }, // immediately expired
    );

    // Small delay to ensure expiry
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Authentication failed',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for token signed with wrong secret', () => {
    const token = jwt.sign({ userId: 'user1', username: 'Dan', role: 'customer' }, 'wrong-secret', {
      expiresIn: '1h',
    });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for malformed token', () => {
    const req = { headers: { authorization: 'Bearer this.is.not.a.valid.jwt' } };
    const res = mockRes();
    const next = mockNext();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
