import axiosInstance from '../../src/services/axiosInstance';
import {
  getAllCategoriesService,
  getCategoryBySlugService,
  getAllCategoriesAdminService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  reorderCategoryService,
} from '../../src/services/categoryService';

jest.mock('../../src/services/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => jest.clearAllMocks());

// getAllCategoriesService tests
describe('getAllCategoriesService', () => {
  test('calls GET /api/categories', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { success: true, categories: [{ name: 'Living Room' }] },
    });

    const result = await getAllCategoriesService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/categories');
    expect(result.categories).toHaveLength(1);
  });
});

// getCategoryBySlugService tests
describe('getCategoryBySlugService', () => {
  test('calls GET /api/categories/:slug', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { success: true, category: { slug: 'bedroom' } },
    });

    const result = await getCategoryBySlugService('bedroom');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/categories/bedroom');
    expect(result.category.slug).toBe('bedroom');
  });
});

// getAllCategoriesAdminService tests
describe('getAllCategoriesAdminService', () => {
  test('calls GET /api/categories/admin/all', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, categories: [] } });

    await getAllCategoriesAdminService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/categories/admin/all');
  });
});

// createCategoryService tests
describe('createCategoryService', () => {
  test('calls POST /api/categories with category data', async () => {
    axiosInstance.post.mockResolvedValue({ data: { success: true } });

    await createCategoryService({ name: 'Outdoor' });

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/categories', { name: 'Outdoor' });
  });
});

// updateCategoryService tests
describe('updateCategoryService', () => {
  test('calls PUT /api/categories/:id', async () => {
    axiosInstance.put.mockResolvedValue({ data: { success: true } });

    await updateCategoryService('cat1', { name: 'Updated' });

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/categories/cat1', { name: 'Updated' });
  });
});

// deleteCategoryService tests
describe('deleteCategoryService', () => {
  test('calls DELETE /api/categories/:id', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    await deleteCategoryService('cat1');

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/categories/cat1');
  });
});

// reorderCategoryService tests
describe('reorderCategoryService', () => {
  test('calls PATCH /api/categories/:id/order', async () => {
    axiosInstance.patch.mockResolvedValue({ data: { success: true } });

    await reorderCategoryService('cat1', { order: 3 });

    expect(axiosInstance.patch).toHaveBeenCalledWith('/api/categories/cat1/order', { order: 3 });
  });
});
