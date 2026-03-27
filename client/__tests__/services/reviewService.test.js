import axiosInstance from '../../src/services/axiosInstance';
import {
  getProductReviewsService,
  createReviewService,
  updateReviewService,
  deleteReviewService,
} from '../../src/services/reviewService';

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

// getProductReviewsService tests
describe('getProductReviewsService', () => {
  test('calls GET /api/reviews/product/:id with params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, reviews: [] } });

    await getProductReviewsService('prod1', { page: 1 });

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/reviews/product/prod1', {
      params: { page: 1 },
    });
  });

  test('defaults to empty params', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true } });

    await getProductReviewsService('prod1');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/reviews/product/prod1', { params: {} });
  });
});

// createReviewService tests
describe('createReviewService', () => {
  test('calls POST /api/reviews with review data', async () => {
    const reviewData = { product: 'prod1', rating: 5, content: 'Excellent quality' };
    axiosInstance.post.mockResolvedValue({ data: { success: true } });

    await createReviewService(reviewData);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/reviews', reviewData);
  });
});

// updateReviewService tests
describe('updateReviewService', () => {
  test('calls PUT /api/reviews/:id with updated data', async () => {
    axiosInstance.put.mockResolvedValue({ data: { success: true } });

    await updateReviewService('rev1', { rating: 4 });

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/reviews/rev1', { rating: 4 });
  });
});

// deleteReviewService tests
describe('deleteReviewService', () => {
  test('calls DELETE /api/reviews/:id', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    await deleteReviewService('rev1');

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/reviews/rev1');
  });
});
