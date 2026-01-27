import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  deactivateAccount,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Profile routes
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);

// Profile picture routes
router.patch(
  '/profile-picture',
  authenticate,
  uploadSingle('profilePicture'),
  uploadProfilePicture,
);
router.delete('/profile-picture', authenticate, deleteProfilePicture);

// Account management
router.delete('/account', authenticate, deactivateAccount);

export default router;
