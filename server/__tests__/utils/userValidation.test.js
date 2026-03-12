import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  updateProfileValidation,
  updateProfilePicture,
  updatePhoneValidation,
  verifyEmail,
  userIdValidation,
  updateUserRoleValidation,
  updateUserStatusValidation,
} from '../../utils/userValidation';

const validObjectId = 'a'.repeat(24);
const invalidObjectId = 'zzzzzzzzzzzzzzzzzzzzzzzz';

// register validation tests
describe('registerValidation', () => {
  const validData = {
    fullName: 'Daniel Olayinka',
    email: 'dan@example.com',
    password: 'StrongP@ss1',
  };

  test('accepts valid registration data', () => {
    const { error } = registerValidation.validate(validData);
    expect(error).toBeUndefined();
  });

  test('accepts valid data with optional phone', () => {
    const { error } = registerValidation.validate({ ...validData, phone: '1234567890' });
    expect(error).toBeUndefined();
  });

  test('lowercases and trims email', () => {
    const { value } = registerValidation.validate({
      ...validData,
      email: '  Dan@EXAMPLE.COM  ',
    });
    expect(value.email).toBe('dan@example.com');
  });

  test('trims fullName', () => {
    const { value } = registerValidation.validate({ ...validData, fullName: '  Daniel  ' });
    expect(value.fullName).toBe('Daniel');
  });

  test('rejects missing fullName', () => {
    const { error } = registerValidation.validate({ email: 'a@b.com', password: '12345678' });
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('fullName');
  });

  test('rejects fullName shorter than 2 chars', () => {
    const { error } = registerValidation.validate({ ...validData, fullName: 'A' });
    expect(error).toBeDefined();
  });

  test('rejects fullName longer than 100 chars', () => {
    const { error } = registerValidation.validate({ ...validData, fullName: 'A'.repeat(101) });
    expect(error).toBeDefined();
  });

  test('rejects missing email', () => {
    const { error } = registerValidation.validate({ fullName: 'Dan', password: '12345678' });
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('email');
  });

  test('rejects invalid email format', () => {
    const { error } = registerValidation.validate({ ...validData, email: 'not-an-email' });
    expect(error).toBeDefined();
  });

  test('rejects missing password', () => {
    const { error } = registerValidation.validate({
      fullName: 'Dan',
      email: 'dan@example.com',
    });
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('password');
  });

  test('rejects password shorter than 8 chars', () => {
    const { error } = registerValidation.validate({ ...validData, password: '1234567' });
    expect(error).toBeDefined();
  });

  test('rejects phone with non-digit characters', () => {
    const { error } = registerValidation.validate({ ...validData, phone: '123-456-789' });
    expect(error).toBeDefined();
  });

  test('rejects phone shorter than 9 digits', () => {
    const { error } = registerValidation.validate({ ...validData, phone: '12345678' });
    expect(error).toBeDefined();
  });

  test('rejects phone longer than 15 digits', () => {
    const { error } = registerValidation.validate({ ...validData, phone: '1234567890123456' });
    expect(error).toBeDefined();
  });

  test('rejects unknown fields', () => {
    const { error } = registerValidation.validate({ ...validData, isAdmin: true });
    expect(error).toBeDefined();
  });
});

// login validation tests
describe('loginValidation', () => {
  test('accepts valid login data', () => {
    const { error } = loginValidation.validate({
      email: 'dan@example.com',
      password: 'password123',
    });
    expect(error).toBeUndefined();
  });

  test('lowercases email', () => {
    const { value } = loginValidation.validate({
      email: 'DAN@Example.COM',
      password: 'pass',
    });
    expect(value.email).toBe('dan@example.com');
  });

  test('rejects missing email', () => {
    const { error } = loginValidation.validate({ password: 'pass' });
    expect(error).toBeDefined();
  });

  test('rejects missing password', () => {
    const { error } = loginValidation.validate({ email: 'a@b.com' });
    expect(error).toBeDefined();
  });

  test('rejects invalid email format', () => {
    const { error } = loginValidation.validate({ email: 'notanemail', password: 'pass' });
    expect(error).toBeDefined();
  });
});

// change password validation tests
describe('changePasswordValidation', () => {
  test('accepts valid password change', () => {
    const { error } = changePasswordValidation.validate({
      currentPassword: 'OldPass12',
      newPassword: 'NewPass12',
    });
    expect(error).toBeUndefined();
  });

  test('rejects newPassword shorter than 8 chars', () => {
    const { error } = changePasswordValidation.validate({
      currentPassword: 'OldPass12',
      newPassword: 'short',
    });
    expect(error).toBeDefined();
  });

  test('rejects missing currentPassword', () => {
    const { error } = changePasswordValidation.validate({ newPassword: 'NewPass12' });
    expect(error).toBeDefined();
  });

  test('rejects missing newPassword', () => {
    const { error } = changePasswordValidation.validate({ currentPassword: 'OldPass12' });
    expect(error).toBeDefined();
  });
});

// forgot password validation tests
describe('forgotPasswordValidation', () => {
  test('accepts valid email', () => {
    const { error } = forgotPasswordValidation.validate({ email: 'dan@test.com' });
    expect(error).toBeUndefined();
  });

  test('rejects invalid email', () => {
    const { error } = forgotPasswordValidation.validate({ email: 'nope' });
    expect(error).toBeDefined();
  });

  test('rejects missing email', () => {
    const { error } = forgotPasswordValidation.validate({});
    expect(error).toBeDefined();
  });
});

// reset password validation tests
describe('resetPasswordValidation', () => {
  test('accepts valid reset data', () => {
    const { error } = resetPasswordValidation.validate({
      token: 'abc123tokenvalue',
      newPassword: 'NewPass12',
    });
    expect(error).toBeUndefined();
  });

  test('rejects missing token', () => {
    const { error } = resetPasswordValidation.validate({ newPassword: 'NewPass12' });
    expect(error).toBeDefined();
  });

  test('rejects short newPassword', () => {
    const { error } = resetPasswordValidation.validate({
      token: 'abc',
      newPassword: '1234567',
    });
    expect(error).toBeDefined();
  });
});

// update profile validation tests
describe('updateProfileValidation', () => {
  test('accepts updating fullName only', () => {
    const { error } = updateProfileValidation.validate({ fullName: 'New Name' });
    expect(error).toBeUndefined();
  });

  test('accepts updating phone only', () => {
    const { error } = updateProfileValidation.validate({ phone: '1234567890' });
    expect(error).toBeUndefined();
  });

  test('accepts updating profilePicture with valid objectId', () => {
    const { error } = updateProfileValidation.validate({ profilePicture: validObjectId });
    expect(error).toBeUndefined();
  });

  test('rejects empty body (min 1 field required)', () => {
    const { error } = updateProfileValidation.validate({});
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/at least one field/i);
  });

  test('accepts addresses array', () => {
    const { error } = updateProfileValidation.validate({
      addresses: [
        {
          street: '123 Main St',
          city: 'Lagos',
          postalCode: '100001',
          country: 'Nigeria',
        },
      ],
    });
    expect(error).toBeUndefined();
  });

  test('rejects address missing required street', () => {
    const { error } = updateProfileValidation.validate({
      addresses: [{ city: 'Lagos', postalCode: '100001', country: 'Nigeria' }],
    });
    expect(error).toBeDefined();
  });

  test('accepts valid address type values', () => {
    const { error } = updateProfileValidation.validate({
      addresses: [
        {
          street: '1 Test St',
          city: 'London',
          postalCode: 'E1 1AA',
          country: 'UK',
          type: 'work',
        },
      ],
    });
    expect(error).toBeUndefined();
  });

  test('rejects invalid address type', () => {
    const { error } = updateProfileValidation.validate({
      addresses: [
        {
          street: '1 Test St',
          city: 'London',
          postalCode: 'E1 1AA',
          country: 'UK',
          type: 'school',
        },
      ],
    });
    expect(error).toBeDefined();
  });
});

// update profile picture validation tests
describe('updateProfilePicture', () => {
  test('accepts valid mediaId', () => {
    const { error } = updateProfilePicture.validate({ mediaId: validObjectId });
    expect(error).toBeUndefined();
  });

  test('rejects missing mediaId', () => {
    const { error } = updateProfilePicture.validate({});
    expect(error).toBeDefined();
  });

  test('rejects invalid hex mediaId', () => {
    const { error } = updateProfilePicture.validate({ mediaId: invalidObjectId });
    expect(error).toBeDefined();
  });
});

// update phone validation tests
describe('updatePhoneValidation', () => {
  test('accepts valid phone', () => {
    const { error } = updatePhoneValidation.validate({ phone: '1234567890' });
    expect(error).toBeUndefined();
  });

  test('rejects phone with letters', () => {
    const { error } = updatePhoneValidation.validate({ phone: '123abc4567' });
    expect(error).toBeDefined();
  });

  test('rejects missing phone', () => {
    const { error } = updatePhoneValidation.validate({});
    expect(error).toBeDefined();
  });
});

// verify email validation tests
describe('verifyEmail', () => {
  test('accepts valid token', () => {
    const { error } = verifyEmail.validate({ token: 'some-verification-token' });
    expect(error).toBeUndefined();
  });

  test('rejects missing token', () => {
    const { error } = verifyEmail.validate({});
    expect(error).toBeDefined();
  });
});

// userId validation tests
describe('userIdValidation', () => {
  test('accepts valid objectId', () => {
    const { error } = userIdValidation.validate({ id: validObjectId });
    expect(error).toBeUndefined();
  });

  test('rejects non-hex id', () => {
    const { error } = userIdValidation.validate({ id: invalidObjectId });
    expect(error).toBeDefined();
  });

  test('rejects id with wrong length', () => {
    const { error } = userIdValidation.validate({ id: 'abc123' });
    expect(error).toBeDefined();
  });

  test('rejects missing id', () => {
    const { error } = userIdValidation.validate({});
    expect(error).toBeDefined();
  });
});

// update user role validation tests
describe('updateUserRoleValidation', () => {
  test('accepts "user" role', () => {
    const { error } = updateUserRoleValidation.validate({ role: 'user' });
    expect(error).toBeUndefined();
  });

  test('accepts "admin" role', () => {
    const { error } = updateUserRoleValidation.validate({ role: 'admin' });
    expect(error).toBeUndefined();
  });

  test('rejects invalid role', () => {
    const { error } = updateUserRoleValidation.validate({ role: 'superadmin' });
    expect(error).toBeDefined();
  });

  test('rejects missing role', () => {
    const { error } = updateUserRoleValidation.validate({});
    expect(error).toBeDefined();
  });
});

// update user status validation tests
describe('updateUserStatusValidation', () => {
  test('accepts true', () => {
    const { error } = updateUserStatusValidation.validate({ isActive: true });
    expect(error).toBeUndefined();
  });

  test('accepts false', () => {
    const { error } = updateUserStatusValidation.validate({ isActive: false });
    expect(error).toBeUndefined();
  });

  test('rejects string value', () => {
    const { error } = updateUserStatusValidation.validate({ isActive: 'yes' });
    expect(error).toBeDefined();
  });

  test('rejects missing isActive', () => {
    const { error } = updateUserStatusValidation.validate({});
    expect(error).toBeDefined();
  });
});
