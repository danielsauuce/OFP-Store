// Attach mocks to `this` so mock.instances[0] has them (returned object !== this)
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(function () {
    this.paymentIntents = {
      create: jest.fn(),
      retrieve: jest.fn(),
    };
    this.webhooks = {
      constructEvent: jest.fn(),
    };
  });
});

process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';

import Stripe from 'stripe';
import { createPaymentIntent, constructWebhookEvent } from '../../services/stripeService.js';

// Capture once — clearAllMocks clears mock.instances[] but our ref remains valid
let stripeInstance;

beforeAll(() => {
  stripeInstance = Stripe.mock.instances[0];
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createPaymentIntent', () => {
  test('creates intent with correct amount, currency, and metadata', async () => {
    const fakeIntent = { id: 'pi_123', client_secret: 'pi_123_secret_abc' };
    stripeInstance.paymentIntents.create.mockResolvedValue(fakeIntent);

    const result = await createPaymentIntent(5000, 'gbp', { orderId: 'ord1' });

    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
      {
        amount: 5000,
        currency: 'gbp',
        metadata: { orderId: 'ord1' },
        automatic_payment_methods: { enabled: true },
      },
      {},
    );
    expect(result).toEqual(fakeIntent);
  });

  test('defaults to gbp currency when not specified', async () => {
    stripeInstance.paymentIntents.create.mockResolvedValue({
      id: 'pi_456',
      client_secret: 'secret',
    });

    await createPaymentIntent(1000);

    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'gbp' }),
      expect.anything(),
    );
  });

  test('defaults to empty metadata when not specified', async () => {
    stripeInstance.paymentIntents.create.mockResolvedValue({
      id: 'pi_789',
      client_secret: 'secret',
    });

    await createPaymentIntent(2000, 'gbp');

    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: {} }),
      expect.anything(),
    );
  });

  test('passes idempotency key when provided', async () => {
    stripeInstance.paymentIntents.create.mockResolvedValue({
      id: 'pi_idem',
      client_secret: 'secret',
    });

    await createPaymentIntent(1000, 'gbp', {}, 'order:abc123');

    expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(expect.anything(), {
      idempotencyKey: 'order:abc123',
    });
  });

  test('propagates stripe errors', async () => {
    stripeInstance.paymentIntents.create.mockRejectedValue(new Error('Invalid API Key'));

    await expect(createPaymentIntent(1000, 'gbp', {})).rejects.toThrow('Invalid API Key');
  });
});

describe('constructWebhookEvent', () => {
  test('calls stripe.webhooks.constructEvent with payload and sig', () => {
    const fakeEvent = { type: 'payment_intent.succeeded', data: { object: {} } };
    stripeInstance.webhooks.constructEvent.mockReturnValue(fakeEvent);

    const payload = Buffer.from('{"type":"payment_intent.succeeded"}');
    const sig = 't=123,v1=abc';

    const result = constructWebhookEvent(payload, sig);

    expect(stripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(payload, sig, 'whsec_fake');
    expect(result).toEqual(fakeEvent);
  });

  test('throws when signature verification fails', () => {
    stripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature');
    });

    expect(() => constructWebhookEvent(Buffer.from('bad'), 'bad-sig')).toThrow(
      'No signatures found matching the expected signature',
    );
  });
});
