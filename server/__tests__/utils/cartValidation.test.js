import { addItem, updateItem } from '../../utils/cartValidation.js';

const validObjectId = 'a'.repeat(24);

// add item
describe('addItem', () => {
  test('accepts valid product with default quantity', () => {
    const { error, value } = addItem.validate({ product: validObjectId });
    expect(error).toBeUndefined();
    expect(value.quantity).toBe(1); // default
  });

  test('accepts valid product with explicit quantity', () => {
    const { error } = addItem.validate({ product: validObjectId, quantity: 3 });
    expect(error).toBeUndefined();
  });

  test('accepts optional variantSku', () => {
    const { error } = addItem.validate({
      product: validObjectId,
      variantSku: 'SOFA-BLK-001',
      quantity: 2,
    });
    expect(error).toBeUndefined();
  });

  test('rejects missing product', () => {
    const { error } = addItem.validate({ quantity: 1 });
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('product');
  });

  test('rejects invalid product objectId', () => {
    const { error } = addItem.validate({ product: 'invalid-id' });
    expect(error).toBeDefined();
  });

  test('rejects quantity of 0', () => {
    const { error } = addItem.validate({ product: validObjectId, quantity: 0 });
    expect(error).toBeDefined();
  });

  test('rejects negative quantity', () => {
    const { error } = addItem.validate({ product: validObjectId, quantity: -1 });
    expect(error).toBeDefined();
  });

  test('rejects non-integer quantity', () => {
    const { error } = addItem.validate({ product: validObjectId, quantity: 1.5 });
    expect(error).toBeDefined();
  });
});

// update item
describe('updateItem', () => {
  test('accepts valid quantity', () => {
    const { error } = updateItem.validate({ quantity: 5 });
    expect(error).toBeUndefined();
  });

  test('rejects missing quantity', () => {
    const { error } = updateItem.validate({});
    expect(error).toBeDefined();
  });

  test('rejects quantity of 0', () => {
    const { error } = updateItem.validate({ quantity: 0 });
    expect(error).toBeDefined();
  });

  test('rejects negative quantity', () => {
    const { error } = updateItem.validate({ quantity: -3 });
    expect(error).toBeDefined();
  });

  test('rejects decimal quantity', () => {
    const { error } = updateItem.validate({ quantity: 2.7 });
    expect(error).toBeDefined();
  });
});
