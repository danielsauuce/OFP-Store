import { addToWishlist } from '../../utils/wishlist.js';
import { createTicket, updateTicket, addReply } from '../../utils/ticketValidation.js';

const validObjectId = 'a'.repeat(24);

// add to wishlist
describe('addToWishlist', () => {
  test('accepts valid productId', () => {
    const { error } = addToWishlist.validate({ productId: validObjectId });
    expect(error).toBeUndefined();
  });

  test('rejects missing productId', () => {
    const { error } = addToWishlist.validate({});
    expect(error).toBeDefined();
  });

  test('rejects invalid hex productId', () => {
    const { error } = addToWishlist.validate({ productId: 'not-valid-hex!!!!!!!!!!!' });
    expect(error).toBeDefined();
  });

  test('rejects productId with wrong length', () => {
    const { error } = addToWishlist.validate({ productId: 'abc123' });
    expect(error).toBeDefined();
  });
});

// create ticket
describe('createTicket (ticketValidation)', () => {
  const validTicket = {
    subject: 'Missing item from order',
    message: 'I received my package but one item is missing.',
  };

  test('accepts valid ticket with required fields', () => {
    const { error } = createTicket.validate(validTicket);
    expect(error).toBeUndefined();
  });

  test('accepts optional name and email (for guest users)', () => {
    const { error } = createTicket.validate({
      ...validTicket,
      name: 'Guest User',
      email: 'guest@example.com',
    });
    expect(error).toBeUndefined();
  });

  test('accepts optional priority', () => {
    const { error } = createTicket.validate({ ...validTicket, priority: 'high' });
    expect(error).toBeUndefined();
  });

  test('rejects invalid email format', () => {
    const { error } = createTicket.validate({ ...validTicket, email: 'not-an-email' });
    expect(error).toBeDefined();
  });

  test('rejects subject shorter than 3 chars', () => {
    const { error } = createTicket.validate({ ...validTicket, subject: 'Hi' });
    expect(error).toBeDefined();
  });

  test('rejects message shorter than 10 chars', () => {
    const { error } = createTicket.validate({ ...validTicket, message: 'Help me' });
    expect(error).toBeDefined();
  });
});

// update ticket
describe('updateTicket', () => {
  test('accepts status update', () => {
    const { error } = updateTicket.validate({ status: 'resolved' });
    expect(error).toBeUndefined();
  });

  test('accepts priority update', () => {
    const { error } = updateTicket.validate({ priority: 'low' });
    expect(error).toBeUndefined();
  });

  test('accepts assignedTo update', () => {
    const { error } = updateTicket.validate({ assignedTo: validObjectId });
    expect(error).toBeUndefined();
  });

  test('rejects empty body (min 1 field)', () => {
    const { error } = updateTicket.validate({});
    expect(error).toBeDefined();
  });

  test('rejects invalid status', () => {
    const { error } = updateTicket.validate({ status: 'pending' });
    expect(error).toBeDefined();
  });

  test('rejects invalid priority', () => {
    const { error } = updateTicket.validate({ priority: 'critical' });
    expect(error).toBeDefined();
  });
});

// add reply
describe('addReply (ticketValidation)', () => {
  test('accepts valid reply', () => {
    const { error } = addReply.validate({ text: 'Thanks for the update!' });
    expect(error).toBeUndefined();
  });

  test('rejects text shorter than 2 chars', () => {
    const { error } = addReply.validate({ text: 'A' });
    expect(error).toBeDefined();
  });

  test('rejects missing text', () => {
    const { error } = addReply.validate({});
    expect(error).toBeDefined();
  });
});
