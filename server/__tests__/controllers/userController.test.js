/* ───────────────────────── Module Mocks ───────────────────────── */
const mockUser = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};
jest.mock('../../models/user.js', () => ({ default: mockUser, __esModule: true }));

jest.mock('../../models/media.js', () => ({
  default: jest.fn(), // constructor
  __esModule: true,
}));

jest.mock('../../config/cloudinary.js', () => ({
  uploadMediaToCloudinary: jest.fn(),
  deleteMediaFromCloudinary: jest.fn(),
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  getUserProfile,
  updateUserProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  deactivateAccount,
} from '../../controllers/userController';

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

// getUserProfile
describe('getUserProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with user profile', async () => {
    const fakeUser = { _id: 'user1', fullName: 'Daniel', email: 'dan@test.com' };
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeUser),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, user: fakeUser }),
    );
  });

  test('returns 404 when user not found', async () => {
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 500 on database error', async () => {
    mockUser.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// updateUserProfile
describe('updateUserProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for empty body', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 when only non-allowed fields are sent', async () => {
    const req = mockReq({
      body: { profilePicture: 'a'.repeat(24) }, // valid but not in allowedFields
    });
    const res = mockRes();

    await updateUserProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No valid fields provided for update' }),
    );
  });

  test('returns 200 with updated user on valid update', async () => {
    const updatedUser = { _id: 'user1', fullName: 'New Name' };
    mockUser.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser),
      }),
    });

    const req = mockReq({ body: { fullName: 'New Name' } });
    const res = mockRes();

    await updateUserProfile(req, res);

    expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(
      'user1',
      { $set: { fullName: 'New Name' } },
      { new: true, runValidators: true },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Profile updated successfully' }),
    );
  });

  test('only includes allowed fields in update', async () => {
    mockUser.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({}),
      }),
    });

    const req = mockReq({
      body: { fullName: 'Dan', phone: '1234567890' },
    });
    const res = mockRes();

    await updateUserProfile(req, res);

    expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(
      'user1',
      { $set: { fullName: 'Dan', phone: '1234567890' } },
      expect.any(Object),
    );
  });
});

// getAddresses
describe('getAddresses', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with addresses array', async () => {
    const fakeUser = {
      addresses: [{ _id: 'addr1', street: '10 Test Rd', city: 'Lagos', postalCode: '100001' }],
    };
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(fakeUser),
    });

    const req = mockReq();
    const res = mockRes();

    await getAddresses(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, addresses: fakeUser.addresses }),
    );
  });

  test('returns 404 when user not found', async () => {
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = mockReq();
    const res = mockRes();

    await getAddresses(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns empty array when user has no addresses', async () => {
    mockUser.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ addresses: [] }),
    });

    const req = mockReq();
    const res = mockRes();

    await getAddresses(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ addresses: [] }));
  });
});

// addAddress
describe('addAddress', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for missing required fields', async () => {
    const req = mockReq({ body: { city: 'Lagos' } }); // missing street and postalCode
    const res = mockRes();

    await addAddress(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when user not found', async () => {
    mockUser.findById.mockResolvedValue(null);

    const req = mockReq({
      body: { street: '10 Test Rd', city: 'Lagos', postalCode: '100001' },
    });
    const res = mockRes();

    await addAddress(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 201 and sets first address as default', async () => {
    const fakeUser = {
      addresses: {
        length: 0,
        push: jest.fn(),
        forEach: jest.fn(),
        map: jest.fn().mockReturnValue([
          {
            _id: 'addr1',
            street: '10 Test Rd',
            city: 'Lagos',
            postalCode: '100001',
            isDefault: true,
          },
        ]),
      },
      save: jest.fn().mockResolvedValue(true),
    };
    mockUser.findById.mockResolvedValue(fakeUser);

    const req = mockReq({
      body: { street: '10 Test Rd', city: 'Lagos', postalCode: '100001' },
    });
    const res = mockRes();

    await addAddress(req, res);

    expect(fakeUser.addresses.push).toHaveBeenCalled();
    expect(fakeUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// deactivateAccount
describe('deactivateAccount', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 on successful deactivation', async () => {
    mockUser.findByIdAndUpdate.mockResolvedValue({ _id: 'user1', isActive: false });

    const req = mockReq();
    const res = mockRes();

    await deactivateAccount(req, res);

    expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(
      'user1',
      { isActive: false },
      { new: true },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('deactivated') }),
    );
  });

  test('returns 500 on database error', async () => {
    mockUser.findByIdAndUpdate.mockRejectedValue(new Error('DB failure'));

    const req = mockReq();
    const res = mockRes();

    await deactivateAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
