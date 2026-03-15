// module mocks
jest.mock('../../models/category.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    exists: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../models/media.js', () => ({
  default: { findByIdAndUpdate: jest.fn() },
  __esModule: true,
}));

jest.mock('../../middleware/cacheMiddleware.js', () => ({
  invalidateCache: jest.fn().mockResolvedValue(true),
  cacheMiddleware: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getAllCategoriesAdmin,
} from '../../controllers/categoryController.js';

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

// get all active categories
describe('getAllCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with active categories', async () => {
    const fakeCats = [{ _id: 'cat1', name: 'Living Room' }];
    Category.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeCats),
          }),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getAllCategories(req, res);

    expect(Category.find).toHaveBeenCalledWith({ isActive: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].count).toBe(1);
  });

  test('returns 500 on error', async () => {
    Category.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getAllCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

//  get category by slug
describe('getCategoryBySlug', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when category not found', async () => {
    Category.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    const req = mockReq({ params: { slug: 'non-existent' } });
    const res = mockRes();

    await getCategoryBySlug(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with category data', async () => {
    const fakeCat = { _id: 'cat1', name: 'Living Room', slug: 'living-room' };
    Category.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeCat),
        }),
      }),
    });

    const req = mockReq({ params: { slug: 'living-room' } });
    const res = mockRes();

    await getCategoryBySlug(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, category: fakeCat }),
    );
  });
});

// create category
describe('createCategory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body (missing name)', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 201 on successful creation', async () => {
    const fakeCat = { _id: 'cat1', name: 'Bedroom', slug: 'bedroom', image: null };
    Category.create.mockResolvedValue(fakeCat);

    const req = mockReq({ body: { name: 'Bedroom' } });
    const res = mockRes();

    await createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Category created successfully' }),
    );
  });

  test('auto-generates slug from name', async () => {
    Category.create.mockResolvedValue({ _id: 'cat1', name: 'Living Room', slug: 'living-room' });

    const req = mockReq({ body: { name: 'Living Room' } });
    const res = mockRes();

    await createCategory(req, res);

    // The slug should have been set on req.body before create was called
    expect(req.body.slug).toBe('living-room');
  });
});

// update category
describe('updateCategory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when category not found', async () => {
    Category.findById.mockResolvedValue(null);

    const req = mockReq({ body: { name: 'Updated' }, params: { id: 'cat1' } });
    const res = mockRes();

    await updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful update', async () => {
    const fakeCat = {
      _id: 'cat1',
      name: 'Old Name',
      image: null,
      save: jest.fn().mockResolvedValue(true),
    };
    Category.findById.mockResolvedValue(fakeCat);

    const req = mockReq({ body: { name: 'New Name' }, params: { id: 'cat1' } });
    const res = mockRes();

    await updateCategory(req, res);

    expect(fakeCat.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// delete category
describe('deleteCategory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when category not found', async () => {
    Category.findById.mockResolvedValue(null);

    const req = mockReq({ params: { id: 'cat1' } });
    const res = mockRes();

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when category has children', async () => {
    Category.findById.mockResolvedValue({ _id: 'cat1', image: null });
    Category.exists.mockResolvedValue({ _id: 'child1' });

    const req = mockReq({ params: { id: 'cat1' } });
    const res = mockRes();

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('subcategories') }),
    );
  });

  test('returns 200 on successful deletion', async () => {
    const fakeCat = {
      _id: 'cat1',
      image: null,
      deleteOne: jest.fn().mockResolvedValue(true),
    };
    Category.findById.mockResolvedValue(fakeCat);
    Category.exists.mockResolvedValue(null);

    const req = mockReq({ params: { id: 'cat1' } });
    const res = mockRes();

    await deleteCategory(req, res);

    expect(fakeCat.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Category deleted successfully' }),
    );
  });
});

// reorder categories
describe('reorderCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body', async () => {
    const req = mockReq({ body: {}, params: { id: 'cat1' } }); // missing order
    const res = mockRes();

    await reorderCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when category not found', async () => {
    Category.findByIdAndUpdate.mockResolvedValue(null);

    const req = mockReq({ body: { order: 3 }, params: { id: 'cat1' } });
    const res = mockRes();

    await reorderCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful reorder', async () => {
    Category.findByIdAndUpdate.mockResolvedValue({ _id: 'cat1', order: 3 });

    const req = mockReq({ body: { order: 3 }, params: { id: 'cat1' } });
    const res = mockRes();

    await reorderCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Category order updated' }),
    );
  });
});

// get all categories for admin (includes inactive)
describe('getAllCategoriesAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with all categories (including inactive)', async () => {
    const fakeCats = [{ _id: 'cat1' }, { _id: 'cat2' }];
    Category.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeCats),
          }),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getAllCategoriesAdmin(req, res);

    // Admin endpoint should NOT filter by isActive
    expect(Category.find).toHaveBeenCalledWith();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].count).toBe(2);
  });
});
