import errorHandler from '../../middleware/errorHandler.js';

// helpers
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = () => ({
  originalUrl: '/api/test',
  method: 'GET',
});

const mockNext = () => jest.fn();

// error handler tests
describe('errorHandler middleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('returns error with statusCode from error object', () => {
    const err = new Error('Not found');
    err.statusCode = 404;

    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Not found',
      }),
    );
  });

  test('returns error with status property from error object', () => {
    const err = new Error('Bad request');
    err.status = 400;

    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('defaults to 500 when no status code on error', () => {
    const err = new Error('Something broke');

    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext());

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('defaults to "Internal server error" when error has no message', () => {
    const err = {};

    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Internal server error',
      }),
    );
  });

  test('includes stack trace in development', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Dev error');
    err.statusCode = 500;

    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext());

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall).toHaveProperty('stack');
  });

  test('excludes stack trace in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Prod error');
    err.statusCode = 500;

    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext());

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall).not.toHaveProperty('stack');
  });

  test('always sets success to false', () => {
    const err = new Error('any error');

    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext());

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(false);
  });
});
