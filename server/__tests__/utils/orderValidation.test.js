import { createOrder, updateStatus } from '../../utils/orderValidation.js';

const validObjectId = 'a'.repeat(24);

// createOrder
describe('createOrder', () => {
  const validOrder = {
    items: [{ product: validObjectId, quantity: 2 }],
    shippingAddress: {
      fullName: 'Daniel Olayinka',
      email: 'dan@test.com',
      phone: '08012345678',
      street: '10 Test Lane',
      city: 'Lagos',
      postalCode: '100001',
    },
    paymentMethod: 'card',
  };

  test('accepts valid order', () => {
    const { error } = createOrder.validate(validOrder);
    expect(error).toBeUndefined();
  });

  test('accepts order with optional notes', () => {
    const { error } = createOrder.validate({ ...validOrder, notes: 'Please deliver before 5pm' });
    expect(error).toBeUndefined();
  });

  test('accepts order with optional variantSku in item', () => {
    const order = {
      ...validOrder,
      items: [{ product: validObjectId, quantity: 1, variantSku: 'CHAIR-RED-M' }],
    };
    const { error } = createOrder.validate(order);
    expect(error).toBeUndefined();
  });

  test('accepts pay_on_delivery payment method', () => {
    const { error } = createOrder.validate({ ...validOrder, paymentMethod: 'pay_on_delivery' });
    expect(error).toBeUndefined();
  });

  test('accepts bank payment method', () => {
    const { error } = createOrder.validate({ ...validOrder, paymentMethod: 'bank' });
    expect(error).toBeUndefined();
  });

  test('rejects missing items', () => {
    const { items, ...rest } = validOrder;
    const { error } = createOrder.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects empty items array', () => {
    const { error } = createOrder.validate({ ...validOrder, items: [] });
    expect(error).toBeDefined();
  });

  test('rejects item with quantity 0', () => {
    const order = {
      ...validOrder,
      items: [{ product: validObjectId, quantity: 0 }],
    };
    const { error } = createOrder.validate(order);
    expect(error).toBeDefined();
  });

  test('rejects item with invalid product id', () => {
    const order = {
      ...validOrder,
      items: [{ product: 'bad-id', quantity: 1 }],
    };
    const { error } = createOrder.validate(order);
    expect(error).toBeDefined();
  });

  test('rejects missing shippingAddress', () => {
    const { shippingAddress, ...rest } = validOrder;
    const { error } = createOrder.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects shippingAddress missing fullName', () => {
    const order = {
      ...validOrder,
      shippingAddress: { ...validOrder.shippingAddress, fullName: undefined },
    };
    const { error } = createOrder.validate(order);
    expect(error).toBeDefined();
  });

  test('rejects shippingAddress missing email', () => {
    const order = {
      ...validOrder,
      shippingAddress: { ...validOrder.shippingAddress, email: undefined },
    };
    const { error } = createOrder.validate(order);
    expect(error).toBeDefined();
  });

  test('rejects shippingAddress with invalid email', () => {
    const order = {
      ...validOrder,
      shippingAddress: { ...validOrder.shippingAddress, email: 'not-valid' },
    };
    const { error } = createOrder.validate(order);
    expect(error).toBeDefined();
  });

  test('rejects missing paymentMethod', () => {
    const { paymentMethod, ...rest } = validOrder;
    const { error } = createOrder.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects invalid paymentMethod', () => {
    const { error } = createOrder.validate({ ...validOrder, paymentMethod: 'crypto' });
    expect(error).toBeDefined();
  });
});

// updateStatus
describe('updateStatus', () => {
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  test.each(validStatuses)('accepts "%s" status', (status) => {
    const { error } = updateStatus.validate({ orderStatus: status });
    expect(error).toBeUndefined();
  });

  test('accepts status with optional note', () => {
    const { error } = updateStatus.validate({
      orderStatus: 'shipped',
      note: 'Dispatched via DHL',
    });
    expect(error).toBeUndefined();
  });

  test('rejects invalid status', () => {
    const { error } = updateStatus.validate({ orderStatus: 'refunded' });
    expect(error).toBeDefined();
  });

  test('rejects missing orderStatus', () => {
    const { error } = updateStatus.validate({});
    expect(error).toBeDefined();
  });
});
