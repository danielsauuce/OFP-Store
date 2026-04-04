// module mocks
jest.mock('../../models/review.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    exists: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../models/product.js', () => ({
  default: { findById: jest.fn() },
  __esModule: true,
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  approveReview,
} from '../../controllers/reviewController.js';

import Review from '../../models/review.js';
import Product from '../../models/product.js';

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
  user: { id: 'user1' },
  ...overrides,
});

const validObjectId = 'a'.repeat(24);

// get all reviews for a product
describe('getProductReviews', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with reviews and pagination', async () => {
    const fakeReviews = [{ _id: 'r1', rating: 5, content: 'Great!' }];
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(fakeReviews),
            }),
          }),
        }),
      }),
    });
    Review.countDocuments.mockResolvedValue(1);

    const req = mockReq({ params: { productId: validObjectId }, query: {} });
    const res = mockRes();

    await getProductReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const data = res.json.mock.calls[0][0];
    expect(data.reviews).toEqual(fakeReviews);
    expect(data.pagination.total).toBe(1);
  });

  test('returns 500 on database error', async () => {
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockRejectedValue(new Error('DB error')),
            }),
          }),
        }),
      }),
    });

    const req = mockReq({ params: { productId: validObjectId }, query: {} });
    const res = mockRes();

    await getProductReviews(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// create review — any authenticated user can review (no purchase gate)
describe('createReview', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body', async () => {
    const req = mockReq({ body: { rating: 6 } }); // rating > 5
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when product not found', async () => {
    Product.findById.mockResolvedValue(null);

    const req = mockReq({
      body: { product: validObjectId, rating: 4, content: 'Good product for the price' },
    });
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product not found' }),
    );
  });

  test('returns 400 when user has already reviewed this product', async () => {
    Product.findById.mockResolvedValue({ _id: validObjectId });
    Review.findOne.mockResolvedValue({ _id: 'existing-review' });

    const req = mockReq({
      body: { product: validObjectId, rating: 4, content: 'Good product for the price' },
    });
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'You have already reviewed this product' }),
    );
  });

  test('returns 201 on successful review creation without requiring a purchase', async () => {
    Product.findById.mockResolvedValue({ _id: validObjectId });
    Review.findOne.mockResolvedValue(null);
    Review.create.mockResolvedValue({
      _id: 'rev1',
      product: validObjectId,
      user: 'user1',
      rating: 4,
      content: 'Good product for the price',
      isVerifiedPurchase: false,
      isApproved: false,
    });

    const req = mockReq({
      body: { product: validObjectId, rating: 4, content: 'Good product for the price' },
    });
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    // isVerifiedPurchase is always false — no purchase gate
    expect(Review.create).toHaveBeenCalledWith(
      expect.objectContaining({ isVerifiedPurchase: false }),
    );
  });

  test('review is pending admin approval after creation', async () => {
    Product.findById.mockResolvedValue({ _id: validObjectId });
    Review.findOne.mockResolvedValue(null);
    Review.create.mockResolvedValue({
      _id: 'rev2',
      product: validObjectId,
      user: 'user1',
      rating: 5,
      content: 'Excellent build quality and finish',
      isApproved: false,
    });

    const req = mockReq({
      body: { product: validObjectId, rating: 5, content: 'Excellent build quality and finish' },
    });
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Review.create).toHaveBeenCalledWith(expect.objectContaining({ isApproved: false }));
  });
});

// update review
describe('updateReview', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for empty body', async () => {
    const req = mockReq({ body: {}, params: { reviewId: 'rev1' } });
    const res = mockRes();

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when review not found or not owned', async () => {
    Review.findOne.mockResolvedValue(null);

    const req = mockReq({
      body: { rating: 3 },
      params: { reviewId: 'rev1' },
    });
    const res = mockRes();

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful update', async () => {
    const fakeReview = {
      _id: 'rev1',
      user: 'user1',
      rating: 4,
      content: 'Updated content here!',
      save: jest.fn().mockResolvedValue(true),
    };
    Review.findOne.mockResolvedValue(fakeReview);

    const req = mockReq({
      body: { rating: 3 },
      params: { reviewId: 'rev1' },
    });
    const res = mockRes();

    await updateReview(req, res);

    expect(fakeReview.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// delete review
describe('deleteReview', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when review not found or not owned', async () => {
    Review.findOne.mockResolvedValue(null);

    const req = mockReq({ params: { reviewId: 'rev1' } });
    const res = mockRes();

    await deleteReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful deletion', async () => {
    Review.findOne.mockResolvedValue({
      _id: 'rev1',
      deleteOne: jest.fn().mockResolvedValue(true),
    });

    const req = mockReq({ params: { reviewId: 'rev1' } });
    const res = mockRes();

    await deleteReview(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Review deleted successfully' }),
    );
  });
});

// get all reviews for admin
describe('getAllReviewsAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with reviews and pagination', async () => {
    const fakeReviews = [{ _id: 'r1' }];
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(fakeReviews),
            }),
          }),
        }),
      }),
    });
    Review.countDocuments.mockResolvedValue(1);

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getAllReviewsAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].pagination.total).toBe(1);
  });

  test('filters by approved status', async () => {
    Review.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });
    Review.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { approved: 'false' } });
    const res = mockRes();

    await getAllReviewsAdmin(req, res);

    // Verify the query was called with isApproved: false
    const findCall = Review.find.mock.calls[0][0];
    expect(findCall.isApproved).toBe(false);
  });
});

// approve review
describe('approveReview', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body', async () => {
    const req = mockReq({
      body: { isApproved: 'maybe' },
      params: { reviewId: 'rev1' },
    });
    const res = mockRes();

    await approveReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when review not found', async () => {
    Review.findById.mockResolvedValue(null);

    const req = mockReq({
      body: { isApproved: true },
      params: { reviewId: 'rev1' },
    });
    const res = mockRes();

    await approveReview(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 and approves review', async () => {
    const fakeReview = {
      _id: 'rev1',
      isApproved: false,
      save: jest.fn().mockResolvedValue(true),
    };
    Review.findById.mockResolvedValue(fakeReview);

    const req = mockReq({
      body: { isApproved: true },
      params: { reviewId: 'rev1' },
    });
    const res = mockRes();

    await approveReview(req, res);

    expect(fakeReview.isApproved).toBe(true);
    expect(fakeReview.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('approved') }),
    );
  });
});
