import {
  createProduct,
  updateProduct,
  updateStock,
  toggleFeatured,
  uploadImages,
} from '../../utils/productValidation.js';

const validObjectId = 'a'.repeat(24);

// createProduct test
describe('createProduct', () => {
  const validProduct = {
    name: 'Luxury Sofa',
    description: 'A premium leather sofa with modern minimalist design and solid oak frame.',
    price: 499.99,
    primaryImage: validObjectId,
    category: validObjectId,
  };

  test('accepts valid product data', () => {
    const { error } = createProduct.validate(validProduct);
    expect(error).toBeUndefined();
  });

  test('accepts full product with all optional fields', () => {
    const full = {
      ...validProduct,
      shortDescription: 'Premium leather sofa',
      compareAtPrice: 699.99,
      images: [validObjectId, 'b'.repeat(24)],
      material: 'Italian Leather',
      dimensions: { width: 200, height: 85, depth: 90 },
      stockQuantity: 25,
      isFeatured: true,
      isActive: true,
      metadata: { weight: '45kg' },
      variants: [
        {
          sku: 'SOFA-BLK-001',
          price: 549.99,
          stockQuantity: 10,
          attributes: { color: 'black' },
        },
      ],
    };
    const { error } = createProduct.validate(full);
    expect(error).toBeUndefined();
  });

  test('rejects missing name', () => {
    const { name, ...rest } = validProduct;
    const { error } = createProduct.validate(rest);
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('name');
  });

  test('rejects name shorter than 3 chars', () => {
    const { error } = createProduct.validate({ ...validProduct, name: 'Ab' });
    expect(error).toBeDefined();
  });

  test('rejects name longer than 200 chars', () => {
    const { error } = createProduct.validate({ ...validProduct, name: 'A'.repeat(201) });
    expect(error).toBeDefined();
  });

  test('rejects missing description', () => {
    const { description, ...rest } = validProduct;
    const { error } = createProduct.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects description shorter than 20 chars', () => {
    const { error } = createProduct.validate({ ...validProduct, description: 'Too short' });
    expect(error).toBeDefined();
  });

  test('rejects missing price', () => {
    const { price, ...rest } = validProduct;
    const { error } = createProduct.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects zero price', () => {
    const { error } = createProduct.validate({ ...validProduct, price: 0 });
    expect(error).toBeDefined();
  });

  test('rejects negative price', () => {
    const { error } = createProduct.validate({ ...validProduct, price: -10 });
    expect(error).toBeDefined();
  });

  test('rejects compareAtPrice less than or equal to price', () => {
    const { error } = createProduct.validate({ ...validProduct, compareAtPrice: 499.99 });
    expect(error).toBeDefined();
  });

  test('accepts compareAtPrice greater than price', () => {
    const { error } = createProduct.validate({ ...validProduct, compareAtPrice: 599.99 });
    expect(error).toBeUndefined();
  });

  test('rejects missing primaryImage', () => {
    const { primaryImage, ...rest } = validProduct;
    const { error } = createProduct.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects non-hex primaryImage', () => {
    const { error } = createProduct.validate({
      ...validProduct,
      primaryImage: 'not-hex-24chars!!!!!!!!',
    });
    expect(error).toBeDefined();
  });

  test('rejects missing category', () => {
    const { category, ...rest } = validProduct;
    const { error } = createProduct.validate(rest);
    expect(error).toBeDefined();
  });

  test('rejects more than 10 images', () => {
    const images = Array(11).fill(validObjectId);
    const { error } = createProduct.validate({ ...validProduct, images });
    expect(error).toBeDefined();
  });

  test('rejects negative stockQuantity', () => {
    const { error } = createProduct.validate({ ...validProduct, stockQuantity: -1 });
    expect(error).toBeDefined();
  });

  test('rejects non-integer stockQuantity', () => {
    const { error } = createProduct.validate({ ...validProduct, stockQuantity: 5.5 });
    expect(error).toBeDefined();
  });

  test('rejects variant missing sku', () => {
    const { error } = createProduct.validate({
      ...validProduct,
      variants: [{ price: 100, stockQuantity: 5 }],
    });
    expect(error).toBeDefined();
  });
});

// updateProduct test
describe('updateProduct', () => {
  test('accepts partial update with just name', () => {
    const { error } = updateProduct.validate({ name: 'Updated Sofa' });
    expect(error).toBeUndefined();
  });

  test('accepts partial update with just price', () => {
    const { error } = updateProduct.validate({ price: 299.99 });
    expect(error).toBeUndefined();
  });

  test('accepts partial update with just isFeatured', () => {
    const { error } = updateProduct.validate({ isFeatured: false });
    expect(error).toBeUndefined();
  });

  test('rejects empty body (min 1 field)', () => {
    const { error } = updateProduct.validate({});
    expect(error).toBeDefined();
  });

  test('still validates constraints on provided fields', () => {
    const { error } = updateProduct.validate({ name: 'Ab' }); // min 3
    expect(error).toBeDefined();
  });
});

// updateStock test
describe('updateStock', () => {
  test('accepts valid stock quantity', () => {
    const { error } = updateStock.validate({ stockQuantity: 50 });
    expect(error).toBeUndefined();
  });

  test('accepts zero stock', () => {
    const { error } = updateStock.validate({ stockQuantity: 0 });
    expect(error).toBeUndefined();
  });

  test('rejects negative stock', () => {
    const { error } = updateStock.validate({ stockQuantity: -1 });
    expect(error).toBeDefined();
  });

  test('rejects missing stockQuantity', () => {
    const { error } = updateStock.validate({});
    expect(error).toBeDefined();
  });

  test('rejects decimal stock', () => {
    const { error } = updateStock.validate({ stockQuantity: 10.5 });
    expect(error).toBeDefined();
  });
});

// toggleFeatured test
describe('toggleFeatured', () => {
  test('accepts true', () => {
    const { error } = toggleFeatured.validate({ isFeatured: true });
    expect(error).toBeUndefined();
  });

  test('accepts false', () => {
    const { error } = toggleFeatured.validate({ isFeatured: false });
    expect(error).toBeUndefined();
  });

  test('rejects missing isFeatured', () => {
    const { error } = toggleFeatured.validate({});
    expect(error).toBeDefined();
  });

  test('rejects string value', () => {
    const { error } = toggleFeatured.validate({ isFeatured: 'yes' });
    expect(error).toBeDefined();
  });
});

// upload image test
describe('uploadImages', () => {
  test('accepts array of valid objectIds', () => {
    const { error } = uploadImages.validate({
      images: [validObjectId, 'b'.repeat(24)],
    });
    expect(error).toBeUndefined();
  });

  test('rejects missing images', () => {
    const { error } = uploadImages.validate({});
    expect(error).toBeDefined();
  });

  test('allows empty images array (Joi .required() does not enforce .min(1))', () => {
    const { error } = uploadImages.validate({ images: [] });
    expect(error).toBeUndefined();
  });

  test('rejects non-hex id in images array', () => {
    const { error } = uploadImages.validate({ images: ['not-a-valid-hex-id!!!!!'] });
    expect(error).toBeDefined();
  });
});
