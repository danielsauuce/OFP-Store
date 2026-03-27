import { createPayment, updatePaymentStatus } from '../../utils/paymentValidation.js';
import { updateSettings, updateShipping, updatePayment } from '../../utils/settingsValidation.js';

// payment validation
describe('createPayment', () => {
  const validPayment = {
    provider: 'paystack',
    intentId: 'pi_123abc456',
    amount: 15000,
  };

  test('accepts valid payment data', () => {
    const { error } = createPayment.validate(validPayment);
    expect(error).toBeUndefined();
  });

  test('applies default currency NGN', () => {
    const { value } = createPayment.validate(validPayment);
    expect(value.currency).toBe('NGN');
  });

  test('accepts optional method "card"', () => {
    const { error } = createPayment.validate({ ...validPayment, method: 'card' });
    expect(error).toBeUndefined();
  });

  test('accepts optional method "bank"', () => {
    const { error } = createPayment.validate({ ...validPayment, method: 'bank' });
    expect(error).toBeUndefined();
  });

  test('accepts optional method "mobile"', () => {
    const { error } = createPayment.validate({ ...validPayment, method: 'mobile' });
    expect(error).toBeUndefined();
  });

  test('rejects invalid method', () => {
    const { error } = createPayment.validate({ ...validPayment, method: 'crypto' });
    expect(error).toBeDefined();
  });

  test('rejects missing provider', () => {
    const { provider, ...rest } = validPayment;
    const { error } = createPayment.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects missing intentId', () => {
    const { intentId, ...rest } = validPayment;
    const { error } = createPayment.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects missing amount', () => {
    const { amount, ...rest } = validPayment;
    const { error } = createPayment.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects zero amount', () => {
    const { error } = createPayment.validate({ ...validPayment, amount: 0 });
    expect(error).toBeDefined();
  });

  test('rejects negative amount', () => {
    const { error } = createPayment.validate({ ...validPayment, amount: -100 });
    expect(error).toBeDefined();
  });
});

// update payment status
describe('updatePaymentStatus', () => {
  const validStatuses = ['pending', 'succeeded', 'failed', 'refunded'];

  test.each(validStatuses)('accepts "%s" status', (status) => {
    const { error } = updatePaymentStatus.validate({ status });
    expect(error).toBeUndefined();
  });

  test('rejects invalid status', () => {
    const { error } = updatePaymentStatus.validate({ status: 'cancelled' });
    expect(error).toBeDefined();
  });

  test('rejects missing status', () => {
    const { error } = updatePaymentStatus.validate({});
    expect(error).toBeDefined();
  });
});

// update settings
describe('updateSettings', () => {
  test('accepts shippingRates object', () => {
    const { error } = updateSettings.validate({
      shippingRates: { standard: 1500, express: 3000 },
    });
    expect(error).toBeUndefined();
  });

  test('accepts paymentMethods array', () => {
    const { error } = updateSettings.validate({
      paymentMethods: ['card', 'bank'],
    });
    expect(error).toBeUndefined();
  });

  test('rejects empty body (min 1 field)', () => {
    const { error } = updateSettings.validate({});
    expect(error).toBeDefined();
  });
});

// update shipping
describe('updateShipping', () => {
  test('accepts valid rates object', () => {
    const { error } = updateShipping.validate({ rates: { standard: 1500 } });
    expect(error).toBeUndefined();
  });

  test('rejects missing rates', () => {
    const { error } = updateShipping.validate({});
    expect(error).toBeDefined();
  });
});

// update payment
describe('updatePayment (settings)', () => {
  test('accepts valid methods array', () => {
    const { error } = updatePayment.validate({ methods: ['card', 'bank'] });
    expect(error).toBeUndefined();
  });

  test('rejects missing methods', () => {
    const { error } = updatePayment.validate({});
    expect(error).toBeDefined();
  });

  test('allows empty methods array (Joi .required() does not enforce .min(1))', () => {
    const { error } = updatePayment.validate({ methods: [] });
    expect(error).toBeUndefined();
  });
});
