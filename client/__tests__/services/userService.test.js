import axiosInstance from '../../src/services/axiosInstance';
import {
  getUserProfileService,
  updateUserProfileService,
  uploadProfilePictureService,
  deleteProfilePictureService,
  getAddressesService,
  addAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
  deactivateAccountService,
} from '../../src/services/userService';

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

// getUserProfileService tests
describe('getUserProfileService', () => {
  test('calls GET /api/users/profile', async () => {
    const mockProfile = { success: true, user: { fullName: 'Daniel' } };
    axiosInstance.get.mockResolvedValue({ data: mockProfile });

    const result = await getUserProfileService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/profile');
    expect(result.user.fullName).toBe('Daniel');
  });
});

// updateUserProfileService tests
describe('updateUserProfileService', () => {
  test('calls PUT /api/users/profile with profile data', async () => {
    axiosInstance.put.mockResolvedValue({ data: { success: true } });

    await updateUserProfileService({ fullName: 'Daniel Updated' });

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/users/profile', {
      fullName: 'Daniel Updated',
    });
  });
});

// uploadProfilePictureService tests
describe('uploadProfilePictureService', () => {
  test('calls PATCH /api/users/profile-picture with FormData', async () => {
    axiosInstance.patch.mockResolvedValue({ data: { success: true } });

    const fakeFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    await uploadProfilePictureService(fakeFile);

    expect(axiosInstance.patch).toHaveBeenCalledWith(
      '/api/users/profile-picture',
      expect.any(FormData),
    );
  });
});

// deleteProfilePictureService tests
describe('deleteProfilePictureService', () => {
  test('calls DELETE /api/users/profile-picture', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    await deleteProfilePictureService();

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/users/profile-picture');
  });
});

// getAddressesService tests
describe('getAddressesService', () => {
  test('calls GET /api/users/addresses', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, addresses: [] } });

    const result = await getAddressesService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/addresses');
    expect(result.addresses).toEqual([]);
  });
});

// addAddressService tests
describe('addAddressService', () => {
  test('calls POST /api/users/addresses', async () => {
    const addr = { street: '10 Marina Road', city: 'Lagos' };
    axiosInstance.post.mockResolvedValue({ data: { success: true } });

    await addAddressService(addr);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/users/addresses', addr);
  });
});

// updateAddressService tests
describe('updateAddressService', () => {
  test('calls PUT /api/users/addresses/:id', async () => {
    axiosInstance.put.mockResolvedValue({ data: { success: true } });

    await updateAddressService('addr1', { city: 'Abuja' });

    expect(axiosInstance.put).toHaveBeenCalledWith('/api/users/addresses/addr1', {
      city: 'Abuja',
    });
  });
});

// deleteAddressService tests
describe('deleteAddressService', () => {
  test('calls DELETE /api/users/addresses/:id', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    await deleteAddressService('addr1');

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/users/addresses/addr1');
  });
});

// setDefaultAddressService tests
describe('setDefaultAddressService', () => {
  test('calls PATCH /api/users/addresses/:id/default', async () => {
    axiosInstance.patch.mockResolvedValue({ data: { success: true } });

    await setDefaultAddressService('addr1');

    expect(axiosInstance.patch).toHaveBeenCalledWith('/api/users/addresses/addr1/default');
  });
});

// deactivateAccountService tests
describe('deactivateAccountService', () => {
  test('calls DELETE /api/users/account', async () => {
    axiosInstance.delete.mockResolvedValue({ data: { success: true } });

    const result = await deactivateAccountService();

    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/users/account');
    expect(result.success).toBe(true);
  });
});
