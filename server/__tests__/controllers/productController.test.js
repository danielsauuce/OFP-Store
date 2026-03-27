jest.mock('../../models/product.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    exists: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../models/category.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    exists: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../models/media.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../middleware/cacheMiddleware.js', () => ({
  invalidateCache: jest.fn().mockResolvedValue(true),
  cacheMiddleware: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../../config/cloudinary.js', () => ({
  deleteMediaFromCloudinary: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../controllers/productController.js';

import Product from '../../models/product.js';
import Category from '../../models/category.js';
import Media from '../../models/media.js';

// helpers
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'admin1', role: 'admin' },
  ...overrides,
});

const validObjectId = 'a'.repeat(24);
const validObjectId2 = 'b'.repeat(24);

// get all products
describe('getAllProducts', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with products and pagination', async () => {
    const fakeProducts = [
      { _id: 'p1', name: 'Sofa', primaryImage: null, images: [], category: null },
    ];
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeProducts),
          }),
        }),
      }),
    });
    Product.countDocuments.mockResolvedValue(1);

    // Mock resolveProductRefs dependencies (Media.find and Category.find)
    Media.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    Category.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getAllProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.data.products).toHaveLength(1);
    expect(data.data.pagination.total).toBe(1);
  });

  test('returns empty array when category filter yields no match', async () => {
    Category.findOne.mockResolvedValue(null);

    const req = mockReq({ query: { category: 'nonexistent' } });
    const res = mockRes();

    await getAllProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.data.products).toEqual([]);
    expect(data.data.pagination.total).toBe(0);
  });

  test('filters by category when found', async () => {
    Category.findOne.mockResolvedValue({ _id: 'cat1' });

    const fakeProducts = [];
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeProducts),
          }),
        }),
      }),
    });
    Product.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { category: 'living-room' } });
    const res = mockRes();

    await getAllProducts(req, res);

    // Product.find should include category filter
    const findCall = Product.find.mock.calls[0][0];
    expect(findCall.category).toBe('cat1');
  });

  test('filters by price range', async () => {
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    Product.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { minPrice: '100', maxPrice: '500' } });
    const res = mockRes();

    await getAllProducts(req, res);

    const findCall = Product.find.mock.calls[0][0];
    expect(findCall.price.$gte).toBe(100);
    expect(findCall.price.$lte).toBe(500);
  });

  test('returns 500 on database error', async () => {
    Product.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    });

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getAllProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// get product by ID
describe('getProductById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid ObjectId', async () => {
    const req = mockReq({ params: { id: 'bad-id' } });
    const res = mockRes();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid product ID' }),
    );
  });

  test('returns 404 when product not found', async () => {
    Product.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with product data', async () => {
    const fakeProduct = {
      _id: validObjectId,
      name: 'Luxury Sofa',
      primaryImage: null,
      images: [],
      category: null,
    };
    Product.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeProduct),
    });

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await getProductById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, product: fakeProduct }),
    );
  });
});

// create product
describe('createProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body (missing required fields)', async () => {
    const req = mockReq({ body: { name: 'Sofa' } }); // missing description, price, etc.
    const res = mockRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when category ID is invalid format', async () => {
    const req = mockReq({
      body: {
        name: 'Luxury Sofa',
        description: 'A beautiful luxury sofa',
        price: 500,
        category: 'not-an-objectid',
        primaryImage: validObjectId,
        stockQuantity: 10,
      },
    });
    const res = mockRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when category does not exist', async () => {
    Category.findById.mockResolvedValue(null);

    const req = mockReq({
      body: {
        name: 'Luxury Sofa',
        description: 'A beautiful luxury sofa',
        price: 500,
        category: validObjectId,
        primaryImage: validObjectId2,
        stockQuantity: 10,
      },
    });
    const res = mockRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Category not found' }),
    );
  });

  test('returns 400 when primaryImage does not exist', async () => {
    Category.findById.mockResolvedValue({ _id: validObjectId });
    Media.findById.mockResolvedValue(null);

    const req = mockReq({
      body: {
        name: 'Luxury Sofa',
        description: 'A beautiful luxury sofa',
        price: 500,
        category: validObjectId,
        primaryImage: validObjectId2,
        stockQuantity: 10,
      },
    });
    const res = mockRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Primary image not found' }),
    );
  });

  test('returns 201 on successful creation', async () => {
    Category.findById.mockResolvedValue({ _id: validObjectId });
    Media.findById.mockResolvedValue({ _id: validObjectId2 });
    Media.findByIdAndUpdate.mockResolvedValue(true);

    const fakeProduct = {
      _id: 'prod1',
      name: 'Luxury Sofa',
      primaryImage: validObjectId2,
      images: [],
    };
    Product.create.mockResolvedValue(fakeProduct);

    const req = mockReq({
      body: {
        name: 'Luxury Sofa',
        description: 'A beautiful luxury sofa',
        price: 500,
        category: validObjectId,
        primaryImage: validObjectId2,
        stockQuantity: 10,
      },
    });
    const res = mockRes();

    await createProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product created successfully' }),
    );
  });
});

// update product
describe('updateProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when product not found', async () => {
    Product.findById.mockResolvedValue(null);

    const req = mockReq({
      body: { name: 'Updated Name' },
      params: { id: validObjectId },
    });
    const res = mockRes();

    await updateProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful update', async () => {
    const fakeProduct = {
      _id: validObjectId,
      name: 'Old Sofa',
      category: { toString: () => validObjectId },
      primaryImage: { toString: () => validObjectId2 },
      images: [],
      save: jest.fn().mockResolvedValue(true),
    };
    Product.findById.mockResolvedValue(fakeProduct);
    Media.updateMany.mockResolvedValue(true);

    const req = mockReq({
      body: { name: 'Updated Sofa' },
      params: { id: validObjectId },
    });
    const res = mockRes();

    await updateProduct(req, res);

    expect(fakeProduct.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product updated successfully' }),
    );
  });
});

// delete product
describe('deleteProduct', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when product not found', async () => {
    Product.findById.mockResolvedValue(null);

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful deletion with no media', async () => {
    const fakeProduct = {
      _id: validObjectId,
      primaryImage: null,
      images: [],
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Product.findById.mockResolvedValue(fakeProduct);

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await deleteProduct(req, res);

    expect(fakeProduct.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product deleted successfully' }),
    );
  });

  test('returns 200 and cleans up media on deletion', async () => {
    const fakeProduct = {
      _id: validObjectId,
      primaryImage: validObjectId2,
      images: [],
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Product.findById.mockResolvedValue(fakeProduct);
    Media.updateMany.mockResolvedValue(true);
    Media.find.mockResolvedValue([]); // no unused media

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await deleteProduct(req, res);

    expect(fakeProduct.deleteOne).toHaveBeenCalled();
    expect(Media.updateMany).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns 500 on database error', async () => {
    Product.findById.mockRejectedValue(new Error('DB error'));

    const req = mockReq({ params: { id: validObjectId } });
    const res = mockRes();

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
