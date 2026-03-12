import {
  createTicketValidation,
  addReplyValidation,
  updateTicketStatusValidation,
} from '../../utils/contactValidation.js';

// create ticket
describe('createTicketValidation', () => {
  const validTicket = {
    subject: 'Delivery Issue',
    message: 'My order has not arrived after 14 days.',
  };

  test('accepts valid ticket', () => {
    const { error } = createTicketValidation.validate(validTicket);
    expect(error).toBeUndefined();
  });

  test('applies default priority of medium', () => {
    const { value } = createTicketValidation.validate(validTicket);
    expect(value.priority).toBe('medium');
  });

  test('accepts explicit priority', () => {
    const { error } = createTicketValidation.validate({ ...validTicket, priority: 'high' });
    expect(error).toBeUndefined();
  });

  test('rejects invalid priority', () => {
    const { error } = createTicketValidation.validate({ ...validTicket, priority: 'urgent' });
    expect(error).toBeDefined();
  });

  test('rejects subject shorter than 3 chars', () => {
    const { error } = createTicketValidation.validate({ ...validTicket, subject: 'Hi' });
    expect(error).toBeDefined();
  });

  test('rejects subject longer than 200 chars', () => {
    const { error } = createTicketValidation.validate({
      ...validTicket,
      subject: 'A'.repeat(201),
    });
    expect(error).toBeDefined();
  });

  test('rejects message shorter than 10 chars', () => {
    const { error } = createTicketValidation.validate({ ...validTicket, message: 'Help' });
    expect(error).toBeDefined();
  });

  test('rejects message longer than 2000 chars', () => {
    const { error } = createTicketValidation.validate({
      ...validTicket,
      message: 'A'.repeat(2001),
    });
    expect(error).toBeDefined();
  });

  test('rejects missing subject', () => {
    const { error } = createTicketValidation.validate({ message: 'A valid message here.' });
    expect(error).toBeDefined();
  });

  test('rejects missing message', () => {
    const { error } = createTicketValidation.validate({ subject: 'Valid Subject' });
    expect(error).toBeDefined();
  });

  test('trims subject and message', () => {
    const { value } = createTicketValidation.validate({
      subject: '  Delivery Issue  ',
      message: '  My order has not arrived after 14 days.  ',
    });
    expect(value.subject).toBe('Delivery Issue');
    expect(value.message).toBe('My order has not arrived after 14 days.');
  });
});

// add reply
describe('addReplyValidation', () => {
  test('accepts valid reply', () => {
    const { error } = addReplyValidation.validate({ text: 'Thank you for your help!' });
    expect(error).toBeUndefined();
  });

  test('rejects text shorter than 2 chars', () => {
    const { error } = addReplyValidation.validate({ text: 'A' });
    expect(error).toBeDefined();
  });

  test('rejects text longer than 2000 chars', () => {
    const { error } = addReplyValidation.validate({ text: 'A'.repeat(2001) });
    expect(error).toBeDefined();
  });

  test('rejects missing text', () => {
    const { error } = addReplyValidation.validate({});
    expect(error).toBeDefined();
  });
});

// update ticket status
describe('updateTicketStatusValidation', () => {
  const validStatuses = ['new', 'open', 'in_progress', 'resolved', 'closed'];

  test.each(validStatuses)('accepts "%s" status', (status) => {
    const { error } = updateTicketStatusValidation.validate({ status });
    expect(error).toBeUndefined();
  });

  test('accepts status with optional priority', () => {
    const { error } = updateTicketStatusValidation.validate({
      status: 'open',
      priority: 'high',
    });
    expect(error).toBeUndefined();
  });

  test('rejects invalid status', () => {
    const { error } = updateTicketStatusValidation.validate({ status: 'pending' });
    expect(error).toBeDefined();
  });

  test('rejects missing status', () => {
    const { error } = updateTicketStatusValidation.validate({});
    expect(error).toBeDefined();
  });

  test('rejects invalid priority value', () => {
    const { error } = updateTicketStatusValidation.validate({
      status: 'open',
      priority: 'critical',
    });
    expect(error).toBeDefined();
  });
});
