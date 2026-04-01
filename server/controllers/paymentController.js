import Order from '../models/order.js';
import Payment from '../models/payment.js';
import { createPaymentIntent, constructWebhookEvent } from '../services/stripeService.js';
import logger from '../utils/logger.js';

export const createPaymentIntentController = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    const amountInPence = Math.round(order.total * 100);

    const intent = await createPaymentIntent(amountInPence, 'gbp', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId: req.user.id,
    });

    // Upsert payment record
    await Payment.findOneAndUpdate(
      { order: order._id },
      {
        order: order._id,
        user: req.user.id,
        stripePaymentIntentId: intent.id,
        amount: order.total,
        currency: 'gbp',
        status: 'pending',
        paymentMethod: 'card',
      },
      { upsert: true, new: true },
    );

    res.status(200).json({
      success: true,
      clientSecret: intent.client_secret,
    });
  } catch (error) {
    logger.error('Create payment intent error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Failed to create payment intent' });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (error) {
    logger.error('Stripe webhook signature verification failed', { error: error.message });
    return res.status(400).json({ success: false, message: `Webhook Error: ${error.message}` });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;

      await Payment.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: 'succeeded' });

      await Order.findOneAndUpdate({ _id: intent.metadata.orderId }, { paymentStatus: 'paid' });

      logger.info('Payment succeeded', { intentId: intent.id, orderId: intent.metadata.orderId });
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;

      await Payment.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: 'failed' });

      await Order.findOneAndUpdate({ _id: intent.metadata.orderId }, { paymentStatus: 'failed' });

      logger.info('Payment failed', { intentId: intent.id, orderId: intent.metadata.orderId });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook processing error', { error: error.message });
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};
