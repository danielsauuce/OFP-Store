import express from 'express';
import { authenticate } from '../middleware/checkAuthMiddleware.js';
import { createPaymentIntentController, stripeWebhook } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-payment-intent', authenticate, createPaymentIntentController);
router.post('/webhook', stripeWebhook);

export default router;
