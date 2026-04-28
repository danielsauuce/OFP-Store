import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (
  amount,
  currency = 'ngn',
  metadata = {},
  idempotencyKey = null,
) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(
      `Invalid payment amount: ${amount}. Must be a positive integer in the smallest currency unit.`,
    );
  }
  const options = idempotencyKey ? { idempotencyKey } : {};
  return await stripe.paymentIntents.create(
    { amount, currency, metadata, automatic_payment_methods: { enabled: true } },
    options,
  );
};

export const retrievePaymentIntent = async (paymentIntentId) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};

export const constructWebhookEvent = (payload, sig) => {
  return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
};
