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
router.put('/update/profile', authenticate, updateUserProfile);

// to update profile picture and then call /profile where profile pictire then shows up
router.patch(
  '/profile-picture',
  authenticate,
  uploadSingle('profilePicture'),
  uploadProfilePicture,
);
router.delete('/delete/profile-picture', authenticate, deleteProfilePicture);

// Account management
router.delete('/account', authenticate, deactivateAccount);

export default router;
