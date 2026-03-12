import { addAddress, updateAddress, setDefault } from '../../utils/addressValidation.js';

// add address
describe('addAddress', () => {
  const validAddress = {
    street: '15 Victoria Island',
    city: 'Lagos',
    postalCode: '100001',
  };

  test('accepts valid address with required fields only', () => {
    const { error } = addAddress.validate(validAddress);
    expect(error).toBeUndefined();
  });

  test('accepts full address with all optional fields', () => {
    const { error } = addAddress.validate({
      ...validAddress,
      fullName: 'Daniel Olayinka',
      phone: '08012345678',
      state: 'Lagos',
      country: 'Nigeria',
      type: 'home',
      isDefault: true,
    });
    expect(error).toBeUndefined();
  });

  test('accepts type "work"', () => {
    const { error } = addAddress.validate({ ...validAddress, type: 'work' });
    expect(error).toBeUndefined();
  });

  test('accepts type "other"', () => {
    const { error } = addAddress.validate({ ...validAddress, type: 'other' });
    expect(error).toBeUndefined();
  });

  test('rejects invalid type', () => {
    const { error } = addAddress.validate({ ...validAddress, type: 'office' });
    expect(error).toBeDefined();
  });

  test('rejects missing street', () => {
    const { error } = addAddress.validate({ city: 'Lagos', postalCode: '100001' });
    expect(error).toBeDefined();
  });

  test('rejects missing city', () => {
    const { error } = addAddress.validate({ street: '15 Test Rd', postalCode: '100001' });
    expect(error).toBeDefined();
  });

  test('rejects missing postalCode', () => {
    const { error } = addAddress.validate({ street: '15 Test Rd', city: 'Lagos' });
    expect(error).toBeDefined();
  });

  test('trims whitespace from string fields', () => {
    const { value } = addAddress.validate({
      street: '  15 Test Rd  ',
      city: '  Lagos  ',
      postalCode: '  100001  ',
    });
    expect(value.street).toBe('15 Test Rd');
    expect(value.city).toBe('Lagos');
    expect(value.postalCode).toBe('100001');
  });
});

// update address
describe('updateAddress', () => {
  test('uses same validation as addAddress', () => {
    // updateAddress is exported as the same schema
    expect(updateAddress).toBe(addAddress);
  });
});

// set default address
describe('setDefault', () => {
  test('accepts true', () => {
    const { error } = setDefault.validate({ isDefault: true });
    expect(error).toBeUndefined();
  });

  test('accepts false', () => {
    const { error } = setDefault.validate({ isDefault: false });
    expect(error).toBeUndefined();
  });

  test('rejects missing isDefault', () => {
    const { error } = setDefault.validate({});
    expect(error).toBeDefined();
  });

  test('rejects string value', () => {
    const { error } = setDefault.validate({ isDefault: 'yes' });
    expect(error).toBeDefined();
  });
});
