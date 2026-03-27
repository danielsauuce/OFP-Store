import {
  objectId,
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} from '../../utils/common.js';

// objectId
describe('objectId', () => {
  test('accepts valid 24-char hex string', () => {
    const { error } = objectId.validate('abcdef0123456789abcdef01');
    expect(error).toBeUndefined();
  });

  test('accepts all-lowercase hex', () => {
    const { error } = objectId.validate('a'.repeat(24));
    expect(error).toBeUndefined();
  });

  test('accepts all-numeric hex', () => {
    const { error } = objectId.validate('0'.repeat(24));
    expect(error).toBeUndefined();
  });

  test('rejects non-hex characters', () => {
    const { error } = objectId.validate('zzzzzzzzzzzzzzzzzzzzzzzz');
    expect(error).toBeDefined();
  });

  test('rejects too-short string', () => {
    const { error } = objectId.validate('abc123');
    expect(error).toBeDefined();
  });

  test('rejects too-long string', () => {
    const { error } = objectId.validate('a'.repeat(25));
    expect(error).toBeDefined();
  });

  test('rejects empty string', () => {
    const { error } = objectId.validate('');
    expect(error).toBeDefined();
  });
});

// register
describe('register (common)', () => {
  const valid = { fullName: 'Dan', email: 'dan@test.com', password: '12345678' };

  test('accepts valid data', () => {
    const { error } = register.validate(valid);
    expect(error).toBeUndefined();
  });

  test('lowercases and trims email', () => {
    const { value } = register.validate({ ...valid, email: '  DAN@TEST.COM  ' });
    expect(value.email).toBe('dan@test.com');
  });

  test('rejects missing fullName', () => {
    const { error } = register.validate({ email: 'a@b.com', password: '12345678' });
    expect(error).toBeDefined();
  });

  test('rejects password under 8 chars', () => {
    const { error } = register.validate({ ...valid, password: '1234567' });
    expect(error).toBeDefined();
  });
});

// login (common)
describe('login (common)', () => {
  test('accepts valid login', () => {
    const { error } = login.validate({ email: 'dan@test.com', password: 'pass' });
    expect(error).toBeUndefined();
  });

  test('rejects missing email', () => {
    const { error } = login.validate({ password: 'pass' });
    expect(error).toBeDefined();
  });

  test('rejects missing password', () => {
    const { error } = login.validate({ email: 'dan@test.com' });
    expect(error).toBeDefined();
  });
});

// change password
describe('changePassword (common)', () => {
  test('accepts valid data', () => {
    const { error } = changePassword.validate({
      currentPassword: '12345678',
      newPassword: 'newpass12',
    });
    expect(error).toBeUndefined();
  });

  test('rejects missing currentPassword', () => {
    const { error } = changePassword.validate({ newPassword: 'newpass12' });
    expect(error).toBeDefined();
  });

  test('rejects newPassword under 8 chars', () => {
    const { error } = changePassword.validate({
      currentPassword: '12345678',
      newPassword: 'short',
    });
    expect(error).toBeDefined();
  });
});

// forgot password
describe('forgotPassword (common)', () => {
  test('accepts valid email', () => {
    const { error } = forgotPassword.validate({ email: 'dan@test.com' });
    expect(error).toBeUndefined();
  });

  test('rejects missing email', () => {
    const { error } = forgotPassword.validate({});
    expect(error).toBeDefined();
  });
});

// reset password
describe('resetPassword (common)', () => {
  test('accepts valid data', () => {
    const { error } = resetPassword.validate({
      token: 'abc123',
      newPassword: 'newpass12',
    });
    expect(error).toBeUndefined();
  });

  test('rejects missing token', () => {
    const { error } = resetPassword.validate({ newPassword: 'newpass12' });
    expect(error).toBeDefined();
  });
});

// verify email
describe('verifyEmail (common)', () => {
  test('accepts valid token', () => {
    const { error } = verifyEmail.validate({ token: 'some-token' });
    expect(error).toBeUndefined();
  });

  test('rejects missing token', () => {
    const { error } = verifyEmail.validate({});
    expect(error).toBeDefined();
  });
});
