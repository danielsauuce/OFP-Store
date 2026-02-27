import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  deactivateAccount,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Profile
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Profile Picture
router.patch('/profile-picture', uploadSingle('profilePicture'), uploadProfilePicture);
router.delete('/profile-picture', deleteProfilePicture);

// Addresses
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);

// Account
router.delete('/account', deactivateAccount);

export default router;
