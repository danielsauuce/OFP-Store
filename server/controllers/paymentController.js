import Order from '../models/order.js';
import Payment from '../models/payment.js';
import Notification from '../models/notification.js';
import { createPaymentIntent, constructWebhookEvent } from '../services/stripeService.js';
import { emitNotification } from '../socket/notificationHandler.js';
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

    res.status(200).json({ success: true, clientSecret: intent.client_secret });
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
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Always acknowledge receipt immediately — processing errors must not return 4xx/5xx
  res.status(200).json({ received: true });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        const { orderId, userId } = intent.metadata || {};

        await Promise.all([
          Payment.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: 'succeeded' }),
          Order.findOneAndUpdate({ _id: orderId }, { paymentStatus: 'paid' }),
        ]);

        // Notify the customer in real-time
        if (userId) {
          const notification = await Notification.create({
            user: userId,
            type: 'order_placed',
            title: 'Payment Confirmed',
            message: `Your payment of £${(intent.amount / 100).toFixed(2)} was successful.`,
            metadata: { orderId, intentId: intent.id },
          });
          emitNotification(userId, notification);
        }

        logger.info('Payment succeeded via webhook', { intentId: intent.id, orderId });
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        const { orderId, userId } = intent.metadata || {};
        const failureMessage =
          intent.last_payment_error?.message || 'Your payment could not be processed.';

        await Promise.all([
          Payment.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: 'failed' }),
          Order.findOneAndUpdate({ _id: orderId }, { paymentStatus: 'failed' }),
        ]);

        if (userId) {
          const notification = await Notification.create({
            user: userId,
            type: 'system',
            title: 'Payment Failed',
            message: failureMessage,
            metadata: { orderId, intentId: intent.id },
          });
          emitNotification(userId, notification);
        }

        logger.warn('Payment failed via webhook', { intentId: intent.id, orderId });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const intentId = charge.payment_intent;

        const payment = await Payment.findOneAndUpdate(
          { stripePaymentIntentId: intentId },
          { status: 'refunded' },
          { new: true },
        );

        if (payment) {
          await Order.findOneAndUpdate({ _id: payment.order }, { paymentStatus: 'refunded' });

          const order = await Order.findById(payment.order).select('user orderNumber').lean();
          if (order?.user) {
            const notification = await Notification.create({
              user: order.user,
              type: 'order_cancelled',
              title: 'Refund Processed',
              message: `Your refund for order #${order.orderNumber} has been processed.`,
              metadata: { orderId: payment.order, intentId },
            });
            emitNotification(order.user.toString(), notification);
          }
        }

        logger.info('Charge refunded via webhook', { intentId });
        break;
      }

      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }
  } catch (error) {
    // Log but do not re-respond — Stripe already got 200
    logger.error('Stripe webhook handler error', { error: error.message, eventType: event.type });
  }
};
