import { createCategory, updateCategory, reorder } from '../../utils/categoryValidation.js';

const validObjectId = 'a'.repeat(24);

// create category
describe('createCategory', () => {
  test('accepts valid category with name only', () => {
    const { error } = createCategory.validate({ name: 'Living Room' });
    expect(error).toBeUndefined();
  });

  test('accepts full category with all optional fields', () => {
    const { error } = createCategory.validate({
      name: 'Bedroom',
      description: 'All bedroom furniture',
      image: validObjectId,
      parent: validObjectId,
      order: 2,
      isActive: true,
    });
    expect(error).toBeUndefined();
  });

  test('rejects missing name', () => {
    const { error } = createCategory.validate({ description: 'Some desc' });
    expect(error).toBeDefined();
  });

  test('rejects name shorter than 2 chars', () => {
    const { error } = createCategory.validate({ name: 'A' });
    expect(error).toBeDefined();
  });

  test('rejects name longer than 100 chars', () => {
    const { error } = createCategory.validate({ name: 'A'.repeat(101) });
    expect(error).toBeDefined();
  });

  test('rejects description longer than 500 chars', () => {
    const { error } = createCategory.validate({
      name: 'Valid',
      description: 'X'.repeat(501),
    });
    expect(error).toBeDefined();
  });

  test('rejects invalid image objectId', () => {
    const { error } = createCategory.validate({ name: 'Test', image: 'bad-id' });
    expect(error).toBeDefined();
  });

  test('rejects negative order', () => {
    const { error } = createCategory.validate({ name: 'Test', order: -1 });
    expect(error).toBeDefined();
  });

  test('trims name', () => {
    const { value } = createCategory.validate({ name: '  Lighting  ' });
    expect(value.name).toBe('Lighting');
  });
});

// update category
describe('updateCategory', () => {
  test('accepts partial update with description only', () => {
    const { error } = updateCategory.validate({ description: 'Updated desc' });
    expect(error).toBeUndefined();
  });

  test('accepts partial update with isActive only', () => {
    const { error } = updateCategory.validate({ isActive: false });
    expect(error).toBeUndefined();
  });

  test('rejects empty body (min 1 field)', () => {
    const { error } = updateCategory.validate({});
    expect(error).toBeDefined();
  });

  test('still validates constraints on provided fields', () => {
    const { error } = updateCategory.validate({ name: 'A' }); // min 2
    expect(error).toBeDefined();
  });
});

// reorder
describe('reorder', () => {
  test('accepts valid order number', () => {
    const { error } = reorder.validate({ order: 5 });
    expect(error).toBeUndefined();
  });

  test('accepts zero', () => {
    const { error } = reorder.validate({ order: 0 });
    expect(error).toBeUndefined();
  });

  test('rejects negative order', () => {
    const { error } = reorder.validate({ order: -1 });
    expect(error).toBeDefined();
  });

  test('rejects missing order', () => {
    const { error } = reorder.validate({});
    expect(error).toBeDefined();
  });

  test('rejects decimal order', () => {
    const { error } = reorder.validate({ order: 2.5 });
    expect(error).toBeDefined();
  });
});
