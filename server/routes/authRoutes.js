import express from 'express';
import {
  registerUser,
  loginUser,
  changePassword,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  refreshTokenHandler,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authenticate, logoutUser);
router.post('/refresh-token', refreshTokenHandler);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// protected routes
router.use(authenticate);

router.post('/change-password', changePassword);
router.get('/me', getCurrentUser);

export default router;
