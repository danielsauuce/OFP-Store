import axiosInstance from '../../src/services/axiosInstance';
import {
  createTicketService,
  getMyTicketsService,
  getTicketByIdService,
  addTicketReplyService,
} from '../../src/services/supportService';

jest.mock('../../src/services/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => jest.clearAllMocks());

// createTicketService tests
describe('createTicketService', () => {
  test('calls POST /api/support with ticket data', async () => {
    const ticket = { subject: 'Order Issue', message: 'My order is late' };
    axiosInstance.post.mockResolvedValue({ data: { success: true, ticketId: 't1' } });

    const result = await createTicketService(ticket);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/support', ticket);
    expect(result.ticketId).toBe('t1');
  });

  test('throws on error', async () => {
    axiosInstance.post.mockRejectedValue(new Error('Server error'));
    await expect(createTicketService({})).rejects.toThrow('Server error');
  });
});

// getMyTicketsService tests
describe('getMyTicketsService', () => {
  test('calls GET /api/support/my-tickets', async () => {
    axiosInstance.get.mockResolvedValue({ data: { success: true, tickets: [] } });

    const result = await getMyTicketsService();

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/support/my-tickets');
    expect(result.tickets).toEqual([]);
  });
});

// getTicketByIdService tests
describe('getTicketByIdService', () => {
  test('calls GET /api/support/:id', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { success: true, ticket: { _id: 't1', subject: 'Help' } },
    });

    const result = await getTicketByIdService('t1');

    expect(axiosInstance.get).toHaveBeenCalledWith('/api/support/t1');
    expect(result.ticket.subject).toBe('Help');
  });
});

// addTicketReplyService tests
describe('addTicketReplyService', () => {
  test('calls POST /api/support/:id/reply with text', async () => {
    axiosInstance.post.mockResolvedValue({ data: { success: true } });

    await addTicketReplyService('t1', 'Any updates?');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/support/t1/reply', {
      text: 'Any updates?',
    });
  });
});
