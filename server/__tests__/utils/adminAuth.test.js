import { isAdmin } from '../../middleware/adminAuth.js';

// helpers
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

// is admin tests
describe('isAdmin middleware', () => {
  test('calls next() for admin user', () => {
    const req = { user: { id: 'admin1', role: 'admin' } };
    const res = mockRes();
    const next = mockNext();

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 when no user on request', () => {
    const req = {};
    const res = mockRes();
    const next = mockNext();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Authentication Required',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when req.user is null', () => {
    const req = { user: null };
    const res = mockRes();
    const next = mockNext();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 for customer role', () => {
    const req = { user: { id: 'user1', role: 'customer' } };
    const res = mockRes();
    const next = mockNext();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('admin only'),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 for "user" role', () => {
    const req = { user: { id: 'user2', role: 'user' } };
    const res = mockRes();
    const next = mockNext();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 for undefined role', () => {
    const req = { user: { id: 'user3' } };
    const res = mockRes();
    const next = mockNext();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
