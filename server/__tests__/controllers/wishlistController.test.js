const mockWishlist = {
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
};
jest.mock('../../models/wishlist.js', () => ({ default: mockWishlist, __esModule: true }));

const mockProduct = { findById: jest.fn() };
jest.mock('../../models/product.js', () => ({ default: mockProduct, __esModule: true }));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getWishlist,
  addProductToWishlist,
  removeFromWishlist,
  clearWishlist,
} from '../../controllers/wishlistController.js';

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

// get wishlist
describe('getWishlist', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates empty wishlist when none exists', async () => {
    mockWishlist.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });
    mockWishlist.create.mockResolvedValue({
      _id: 'wl1',
      products: [],
    });

    const req = mockReq();
    const res = mockRes();

    await getWishlist(req, res);

    expect(mockWishlist.create).toHaveBeenCalledWith({ user: 'user1', products: [] });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('returns existing wishlist with product count', async () => {
    const wishlist = {
      _id: 'wl1',
      products: [
        { _id: 'prod1', name: 'Sofa' },
        { _id: 'prod2', name: 'Chair' },
      ],
    };
    mockWishlist.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(wishlist),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.wishlist.count).toBe(2);
  });
});

// add product to wishlist
describe('addProductToWishlist', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body (missing productId)', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await addProductToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when product not found', async () => {
    mockProduct.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq({ body: { productId: validObjectId } });
    const res = mockRes();

    await addProductToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product not found or unavailable' }),
    );
  });

  test('returns 404 when product is inactive', async () => {
    mockProduct.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: validObjectId, isActive: false }),
    });

    const req = mockReq({ body: { productId: validObjectId } });
    const res = mockRes();

    await addProductToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when product is already in wishlist', async () => {
    mockProduct.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: validObjectId, isActive: true }),
    });
    mockWishlist.findOne.mockResolvedValue({
      products: [{ toString: () => validObjectId }],
    });

    const req = mockReq({ body: { productId: validObjectId } });
    const res = mockRes();

    await addProductToWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product is already in your wishlist' }),
    );
  });

  test('returns 200 on successful add', async () => {
    mockProduct.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: validObjectId, isActive: true }),
    });
    const fakeWishlist = {
      _id: 'wl1',
      products: [],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    fakeWishlist.products.some = jest.fn().mockReturnValue(false);
    fakeWishlist.products.push = jest.fn();
    fakeWishlist.products.length = 1; // after push
    mockWishlist.findOne.mockResolvedValue(fakeWishlist);

    const req = mockReq({ body: { productId: validObjectId } });
    const res = mockRes();

    await addProductToWishlist(req, res);

    expect(fakeWishlist.products.push).toHaveBeenCalledWith(validObjectId);
    expect(fakeWishlist.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// remove from wishlist
describe('removeFromWishlist', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when wishlist not found', async () => {
    mockWishlist.findOne.mockResolvedValue(null);

    const req = mockReq({ params: { productId: validObjectId } });
    const res = mockRes();

    await removeFromWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Wishlist not found' }),
    );
  });

  test('returns 404 when product not in wishlist', async () => {
    mockWishlist.findOne.mockResolvedValue({
      products: [{ toString: () => 'different-product-id' }],
      save: jest.fn(),
      populate: jest.fn().mockResolvedValue(true),
    });

    const req = mockReq({ params: { productId: validObjectId } });
    const res = mockRes();

    await removeFromWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product not found in wishlist' }),
    );
  });

  test('returns 200 on successful removal', async () => {
    const fakeWishlist = {
      _id: 'wl1',
      products: [{ toString: () => validObjectId }, { toString: () => 'other-product' }],
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };
    mockWishlist.findOne.mockResolvedValue(fakeWishlist);

    const req = mockReq({ params: { productId: validObjectId } });
    const res = mockRes();

    await removeFromWishlist(req, res);

    expect(fakeWishlist.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Product removed from wishlist' }),
    );
  });
});

// clear whishlist
describe('clearWishlist', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 on successful clear', async () => {
    mockWishlist.findOneAndUpdate.mockResolvedValue({ products: [] });

    const req = mockReq();
    const res = mockRes();

    await clearWishlist(req, res);

    expect(mockWishlist.findOneAndUpdate).toHaveBeenCalledWith(
      { user: 'user1' },
      { products: [] },
      { new: true },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Wishlist cleared successfully' }),
    );
  });

  test('returns 500 on error', async () => {
    mockWishlist.findOneAndUpdate.mockRejectedValue(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await clearWishlist(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
