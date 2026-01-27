import express from 'express';
import {
  registerUser,
  loginUser,
  changePassword,
  checkAuth,
  logoutUser,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/checkAuthMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/reset-password', authenticate, changePassword);

router.get('/logout', logoutUser);

router.get('/check-auth', authenticate, checkAuth);

export default router;
