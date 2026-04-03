// Mock the stripe package before importing stripeService
const mockCreate = jest.fn();
const mockConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockCreate,
    },
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }));
});

import { createPaymentIntent, constructWebhookEvent } from '../../services/stripeService.js';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
});

describe('createPaymentIntent', () => {
  test('creates intent with correct amount, currency, and metadata', async () => {
    const fakeIntent = { id: 'pi_123', client_secret: 'pi_123_secret_abc' };
    mockCreate.mockResolvedValue(fakeIntent);

    const result = await createPaymentIntent(5000, 'gbp', { orderId: 'ord1' });

    expect(mockCreate).toHaveBeenCalledWith({
      amount: 5000,
      currency: 'gbp',
      metadata: { orderId: 'ord1' },
      automatic_payment_methods: { enabled: true },
    });
    expect(result).toEqual(fakeIntent);
  });

  test('defaults to gbp currency when not specified', async () => {
    mockCreate.mockResolvedValue({ id: 'pi_456', client_secret: 'secret' });

    await createPaymentIntent(1000);

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ currency: 'gbp' }));
  });

  test('defaults to empty metadata when not specified', async () => {
    mockCreate.mockResolvedValue({ id: 'pi_789', client_secret: 'secret' });

    await createPaymentIntent(2000, 'gbp');

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ metadata: {} }));
  });

  test('propagates stripe errors', async () => {
    mockCreate.mockRejectedValue(new Error('Invalid API Key'));

    await expect(createPaymentIntent(1000, 'gbp', {})).rejects.toThrow('Invalid API Key');
  });
});

describe('constructWebhookEvent', () => {
  test('calls stripe.webhooks.constructEvent with payload and sig', () => {
    const fakeEvent = { type: 'payment_intent.succeeded', data: { object: {} } };
    mockConstructEvent.mockReturnValue(fakeEvent);

    const payload = Buffer.from('{"type":"payment_intent.succeeded"}');
    const sig = 't=123,v1=abc';

    const result = constructWebhookEvent(payload, sig);

    expect(mockConstructEvent).toHaveBeenCalledWith(payload, sig, 'whsec_fake');
    expect(result).toEqual(fakeEvent);
  });

  test('throws when signature verification fails', () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature');
    });

    expect(() => constructWebhookEvent(Buffer.from('bad'), 'bad-sig')).toThrow(
      'No signatures found matching the expected signature',
    );
  });
});
