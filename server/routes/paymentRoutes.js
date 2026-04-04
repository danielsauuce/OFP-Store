import express from 'express';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import {
  createPaymentIntentController,
  stripeWebhook,
  confirmPaymentSuccess,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-payment-intent', authenticate, createPaymentIntentController);
router.post('/confirm-success', authenticate, confirmPaymentSuccess);
router.post('/webhook', stripeWebhook);

export default router;
