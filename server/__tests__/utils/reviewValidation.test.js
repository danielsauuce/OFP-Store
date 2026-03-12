import { createReview, updateReview, approve } from '../../utils/reviewValidation.js';

const validObjectId = 'a'.repeat(24);

// create review
describe('createReview', () => {
  const validReview = {
    product: validObjectId,
    rating: 4,
    content: 'This sofa is absolutely fantastic, love the quality!',
  };

  test('accepts valid review', () => {
    const { error } = createReview.validate(validReview);
    expect(error).toBeUndefined();
  });

  test('accepts rating of 1 (min)', () => {
    const { error } = createReview.validate({ ...validReview, rating: 1 });
    expect(error).toBeUndefined();
  });

  test('accepts rating of 5 (max)', () => {
    const { error } = createReview.validate({ ...validReview, rating: 5 });
    expect(error).toBeUndefined();
  });

  test('rejects rating of 0', () => {
    const { error } = createReview.validate({ ...validReview, rating: 0 });
    expect(error).toBeDefined();
  });

  test('rejects rating of 6', () => {
    const { error } = createReview.validate({ ...validReview, rating: 6 });
    expect(error).toBeDefined();
  });

  test('rejects decimal rating', () => {
    const { error } = createReview.validate({ ...validReview, rating: 3.5 });
    expect(error).toBeDefined();
  });

  test('rejects content shorter than 10 chars', () => {
    const { error } = createReview.validate({ ...validReview, content: 'Good' });
    expect(error).toBeDefined();
  });

  test('rejects content longer than 1000 chars', () => {
    const { error } = createReview.validate({ ...validReview, content: 'A'.repeat(1001) });
    expect(error).toBeDefined();
  });

  test('rejects missing product', () => {
    const { product, ...rest } = validReview;
    const { error } = createReview.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects missing rating', () => {
    const { rating, ...rest } = validReview;
    const { error } = createReview.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects missing content', () => {
    const { content, ...rest } = validReview;
    const { error } = createReview.validate(rest);
    expect(error).toBeDefined();
  });

  test('trims content whitespace', () => {
    const { value } = createReview.validate({
      ...validReview,
      content: '   Great quality product, love it!   ',
    });
    expect(value.content).toBe('Great quality product, love it!');
  });
});

// update review
describe('updateReview', () => {
  test('accepts updating rating only', () => {
    const { error } = updateReview.validate({ rating: 5 });
    expect(error).toBeUndefined();
  });

  test('accepts updating content only', () => {
    const { error } = updateReview.validate({ content: 'Updated review content here!' });
    expect(error).toBeUndefined();
  });

  test('accepts updating both rating and content', () => {
    const { error } = updateReview.validate({
      rating: 3,
      content: 'Changed my mind about this product.',
    });
    expect(error).toBeUndefined();
  });

  test('rejects empty body (min 1 field)', () => {
    const { error } = updateReview.validate({});
    expect(error).toBeDefined();
  });

  test('still validates rating range on update', () => {
    const { error } = updateReview.validate({ rating: 10 });
    expect(error).toBeDefined();
  });

  test('still validates content length on update', () => {
    const { error } = updateReview.validate({ content: 'Short' });
    expect(error).toBeDefined();
  });
});

// approve review
describe('approve', () => {
  test('accepts true', () => {
    const { error } = approve.validate({ isApproved: true });
    expect(error).toBeUndefined();
  });

  test('accepts false', () => {
    const { error } = approve.validate({ isApproved: false });
    expect(error).toBeUndefined();
  });

  test('rejects missing isApproved', () => {
    const { error } = approve.validate({});
    expect(error).toBeDefined();
  });

  test('rejects string value', () => {
    const { error } = approve.validate({ isApproved: 'true' });
    expect(error).toBeDefined();
  });
});
