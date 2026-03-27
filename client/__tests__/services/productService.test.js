import axiosInstance from '../../src/services/axiosInstance';
import {
  getAllProductsService,
  getProductByIdService,
  getProductsByCategoryService,
  getAllProductsAdminService,
  getProductByIdAdminService,
  createProductService,
  updateProductService,
  deleteProductService,
} from '../../src/services/productService';

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

// getAllProductsService tests
describe('getAllProductsService', () => {
  test('calls GET /api/product with params', async () => {
    const mockData = { success: true, data: { products: [], pagination: {} } };
    axiosInstance.get.mockResolvedValue({ data: mockData });

    const result = await getAllProductsService({ page: 2, category: 'sofa' });

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/product', {
      params: { page: 2, category: 'sofa' },
    });
    expect(result.success).toBe(true);
  });

  test('defaults to empty params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true } });

    await getAllProductsService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/product', { params: {} });
  });
});

// getProductByIdService tests
describe('getProductByIdService', () => {
  test('calls GET /api/product/:id', async () => {
    const mockProduct = { success: true, product: { _id: 'p1', name: 'Sofa' } };
    axiosInstance.get.mockResolvedValue({ data: mockProduct });

    const result = await getProductByIdService('p1');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/product/p1');
    expect(result.product.name).toBe('Sofa');
  });

  test('throws on 404', async () => {
    axiosInstance.get.mockRejectedValue(new Error('Not Found'));
    await expect(getProductByIdService('bad-id')).rejects.toThrow('Not Found');
  });
});

// getProductsByCategoryService tests
describe('getProductsByCategoryService', () => {
  test('calls GET /api/product/category/:slug with params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true } });

    await getProductsByCategoryService('living-room', { page: 1 });

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/product/category/living-room', {
      params: { page: 1 },
    });
  });
});

// getAllProductsAdminService tests
describe('getAllProductsAdminService', () => {
  test('calls GET /api/admin/products', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true } });

    await getAllProductsAdminService({ page: 1, limit: 20 });

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/admin/products', {
      params: { page: 1, limit: 20 },
    });
  });
});

// getProductByIdAdminService tests
describe('getProductByIdAdminService', () => {
  test('calls GET /api/admin/products/:id', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, product: {} } });

    await getProductByIdAdminService('p1');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/admin/products/p1');
  });
});

// createProductService tests
describe('createProductService', () => {
  test('calls POST /api/admin/products/create with product data', async () => {
    const productData = { name: 'New Sofa', price: 500 };
    axiosInstance.post.mockResolvedValue({ data: { success: true, product: productData } });

    const result = await createProductService(productData);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/admin/products/create', productData);
    expect(result.success).toBe(true);
  });
});

// updateProductService tests
describe('updateProductService', () => {
  test('calls PUT /api/admin/products/update/:id', async () => {
    axiosInstance.put.mockResolvedValue({ data: { success: true } });

    await updateProductService('p1', { name: 'Updated Sofa' });

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/admin/products/update/p1', {
      name: 'Updated Sofa',
    });
  });
});

// deleteProductService tests
describe('deleteProductService', () => {
  test('calls DELETE /api/admin/products/delete/:id', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    await deleteProductService('p1');

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/admin/products/delete/p1');
  });
});
