import express from 'express';
import {
  registerUser,
  loginUser,
  changePassword,
  checkAuth,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// protected routes
router.use(authenticate);

router.post('/reset-password', changePassword);
router.get('/check-auth', checkAuth);
router.get('/me', getCurrentUser);

export default router;
