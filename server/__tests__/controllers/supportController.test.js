// module mocks
jest.mock('../../models/ticket.js', () => ({
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
  __esModule: true,
}));

jest.mock('../../utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
  __esModule: true,
}));

import {
  createTicket,
  getMyTickets,
  getTicketById,
  addReply,
  getAllTicketsAdmin,
  getTicketAdmin,
  updateTicketAdmin,
  addAdminReply,
} from '../../controllers/supportController.js';

import Ticket from '../../models/ticket.js';

// helpers
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user1' },
  ...overrides,
});

// create ticket
describe('createTicket', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body (missing subject)', async () => {
    const req = mockReq({ body: { message: 'Help me please' } });
    const res = mockRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 201 on successful ticket creation', async () => {
    Ticket.create.mockResolvedValue({
      _id: 'ticket1',
      subject: 'Order Issue',
      message: 'My order is delayed and I need help',
      status: 'new',
    });

    const req = mockReq({
      body: { subject: 'Order Issue', message: 'My order is delayed and I need help' },
    });
    const res = mockRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Support ticket created successfully',
        ticketId: 'ticket1',
      }),
    );
  });

  test('returns 500 on database error', async () => {
    Ticket.create.mockRejectedValue(new Error('DB error'));

    const req = mockReq({
      body: { subject: 'Help', message: 'I need assistance with my account please' },
    });
    const res = mockRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// get my tickets
describe('getMyTickets', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with user tickets', async () => {
    const fakeTickets = [{ _id: 't1', subject: 'Help' }];
    Ticket.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeTickets),
        }),
      }),
    });

    const req = mockReq();
    const res = mockRes();

    await getMyTickets(req, res);

    expect(Ticket.find).toHaveBeenCalledWith({ user: 'user1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, tickets: fakeTickets }),
    );
  });
});

// get ticket by id (user)
describe('getTicketById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when ticket not found or not authorized', async () => {
    Ticket.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    });

    const req = mockReq({ params: { id: 'ticket1' } });
    const res = mockRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with ticket data', async () => {
    const fakeTicket = { _id: 'ticket1', subject: 'Help', user: 'user1' };
    Ticket.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeTicket),
      }),
    });

    const req = mockReq({ params: { id: 'ticket1' } });
    const res = mockRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ticket: fakeTicket }));
  });
});

// add user reply
describe('addReply', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body (missing text)', async () => {
    const req = mockReq({ body: {}, params: { id: 'ticket1' } });
    const res = mockRes();

    await addReply(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when ticket not found', async () => {
    Ticket.findOne.mockResolvedValue(null);

    const req = mockReq({ body: { text: 'Hello, any update?' }, params: { id: 'ticket1' } });
    const res = mockRes();

    await addReply(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when ticket is closed', async () => {
    Ticket.findOne.mockResolvedValue({
      _id: 'ticket1',
      status: 'closed',
      replies: [],
    });

    const req = mockReq({ body: { text: 'Hello, any update?' }, params: { id: 'ticket1' } });
    const res = mockRes();

    await addReply(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Cannot reply to closed or resolved ticket' }),
    );
  });

  test('returns 400 when ticket is resolved', async () => {
    Ticket.findOne.mockResolvedValue({
      _id: 'ticket1',
      status: 'resolved',
      replies: [],
    });

    const req = mockReq({ body: { text: 'Hello, any update?' }, params: { id: 'ticket1' } });
    const res = mockRes();

    await addReply(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 200 and adds reply, transitions new → open', async () => {
    const fakeTicket = {
      _id: 'ticket1',
      status: 'new',
      replies: [],
      save: jest.fn().mockResolvedValue(true),
    };
    fakeTicket.replies.push = jest.fn();
    Ticket.findOne.mockResolvedValue(fakeTicket);

    const req = mockReq({ body: { text: 'Hello, any update?' }, params: { id: 'ticket1' } });
    const res = mockRes();

    await addReply(req, res);

    expect(fakeTicket.replies.push).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hello, any update?', author: 'user1' }),
    );
    expect(fakeTicket.status).toBe('open');
    expect(fakeTicket.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// get all tickets (admin)
describe('getAllTicketsAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with paginated tickets', async () => {
    Ticket.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    });
    Ticket.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: {} });
    const res = mockRes();

    await getAllTicketsAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('filters by whitelisted status', async () => {
    Ticket.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    });
    Ticket.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { status: 'open', priority: 'high' } });
    const res = mockRes();

    await getAllTicketsAdmin(req, res);

    const findCall = Ticket.find.mock.calls[0][0];
    expect(findCall.status).toBe('open');
    expect(findCall.priority).toBe('high');
  });

  test('ignores non-whitelisted status/priority values', async () => {
    Ticket.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    });
    Ticket.countDocuments.mockResolvedValue(0);

    const req = mockReq({ query: { status: 'hacked', priority: '{$ne:null}' } });
    const res = mockRes();

    await getAllTicketsAdmin(req, res);

    const findCall = Ticket.find.mock.calls[0][0];
    expect(findCall.status).toBeUndefined();
    expect(findCall.priority).toBeUndefined();
  });
});

// get ticket by id (admin)
describe('getTicketAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when ticket not found', async () => {
    Ticket.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        }),
      }),
    });

    const req = mockReq({ params: { id: 'ticket1' } });
    const res = mockRes();

    await getTicketAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 with ticket', async () => {
    const fakeTicket = { _id: 'ticket1', subject: 'Help' };
    Ticket.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(fakeTicket),
          }),
        }),
      }),
    });

    const req = mockReq({ params: { id: 'ticket1' } });
    const res = mockRes();

    await getTicketAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// update ticket (admin)
describe('updateTicketAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when ticket not found', async () => {
    Ticket.findById.mockResolvedValue(null);

    const req = mockReq({
      body: { status: 'in_progress' },
      params: { id: 'ticket1' },
    });
    const res = mockRes();

    await updateTicketAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 on successful update', async () => {
    const fakeTicket = {
      _id: 'ticket1',
      status: 'new',
      priority: 'medium',
      save: jest.fn().mockResolvedValue(true),
    };
    Ticket.findById.mockResolvedValue(fakeTicket);

    const req = mockReq({
      body: { status: 'in_progress', priority: 'high' },
      params: { id: 'ticket1' },
    });
    const res = mockRes();

    await updateTicketAdmin(req, res);

    expect(fakeTicket.status).toBe('in_progress');
    expect(fakeTicket.priority).toBe('high');
    expect(fakeTicket.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// add admin reply
describe('addAdminReply', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 for invalid body', async () => {
    const req = mockReq({ body: {}, params: { id: 'ticket1' } });
    const res = mockRes();

    await addAdminReply(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when ticket not found', async () => {
    Ticket.findById.mockResolvedValue(null);

    const req = mockReq({
      body: { text: 'We are looking into this' },
      params: { id: 'ticket1' },
    });
    const res = mockRes();

    await addAdminReply(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 and transitions new → in_progress', async () => {
    const fakeTicket = {
      _id: 'ticket1',
      status: 'new',
      replies: [],
      save: jest.fn().mockResolvedValue(true),
    };
    fakeTicket.replies.push = jest.fn();
    Ticket.findById.mockResolvedValue(fakeTicket);

    const req = mockReq({
      body: { text: 'We are looking into this' },
      params: { id: 'ticket1' },
    });
    const res = mockRes();

    await addAdminReply(req, res);

    expect(fakeTicket.status).toBe('in_progress');
    expect(fakeTicket.replies.push).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'We are looking into this', author: 'user1' }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
