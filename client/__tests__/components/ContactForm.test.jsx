import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from '../../src/components/ContactForm';
import toast from 'react-hot-toast';

/* ── Mocks ────────────────────────────────────────────────── */
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

jest.mock('gsap', () => {
  const mockTimeline = { to: jest.fn().mockReturnThis(), play: jest.fn(), reverse: jest.fn() };
  return {
    __esModule: true,
    default: {
      fromTo: jest.fn(),
      from: jest.fn(),
      context: jest.fn(() => ({ revert: jest.fn() })),
      utils: { toArray: jest.fn(() => []) },
      timeline: jest.fn(() => mockTimeline),
      registerPlugin: jest.fn(),
    },
    ScrollTrigger: {},
  };
});

jest.mock('gsap/ScrollTrigger', () => ({
  __esModule: true,
  ScrollTrigger: {},
}));

const mockCreateTicket = jest.fn();
jest.mock('../../src/services/supportService', () => ({
  createTicketService: (...args) => mockCreateTicket(...args),
}));

// Use the __mocks__/react-hot-toast.js auto-mock (no factory needed)
jest.mock('react-hot-toast');

beforeEach(() => {
  jest.clearAllMocks();
});

/* Helper: fill all 4 required fields */
const fillForm = async (user, overrides = {}) => {
  const values = {
    name: 'Daniel Olayinka',
    email: 'dan@test.com',
    subject: 'Order Issue',
    message: 'My order has not arrived yet, please help me.',
    ...overrides,
  };

  await user.type(screen.getByLabelText(/^name/i), values.name);
  await user.type(screen.getByLabelText(/^email/i), values.email);
  await user.type(screen.getByLabelText(/^subject/i), values.subject);
  await user.type(screen.getByLabelText(/^message/i), values.message);
};

/* ═══════════════════════════════════════════════════════════ */
describe('ContactForm', () => {
  /* ── Rendering ──────────────────────────────────────────── */
  test('renders all form fields and submit button', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  /* ── Button disabled state ──────────────────────────────── */
  test('submit button is disabled when form is empty', () => {
    render(<ContactForm />);

    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  test('submit button becomes enabled when all fields filled', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await fillForm(user);

    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled();
  });

  /* ── Validation ─────────────────────────────────────────── */
  test('shows validation error for short name', () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: 'A', name: 'name' } });
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'dan@test.com', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText(/^subject/i), {
      target: { value: 'Help me', name: 'subject' },
    });
    fireEvent.change(screen.getByLabelText(/^message/i), {
      target: { value: 'My order has not arrived and I need help', name: 'message' },
    });

    const form = screen.getByLabelText(/^name/i).closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(mockCreateTicket).not.toHaveBeenCalled();
  });

  test('shows validation error for short message', () => {
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: 'Daniel', name: 'name' },
    });
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'dan@test.com', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText(/^subject/i), {
      target: { value: 'Help me', name: 'subject' },
    });
    fireEvent.change(screen.getByLabelText(/^message/i), {
      target: { value: 'Short', name: 'message' },
    });

    const form = screen.getByLabelText(/^name/i).closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument();
  });

  /* ── Successful submit ──────────────────────────────────── */
  test('calls createTicketService and shows success toast', async () => {
    mockCreateTicket.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<ContactForm />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(mockCreateTicket).toHaveBeenCalledWith({
        name: 'Daniel Olayinka',
        email: 'dan@test.com',
        subject: 'Order Issue',
        message: 'My order has not arrived yet, please help me.',
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  test('resets form after successful submission', async () => {
    mockCreateTicket.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<ContactForm />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^name/i)).toHaveValue('');
    });

    expect(screen.getByLabelText(/^email/i)).toHaveValue('');
    expect(screen.getByLabelText(/^subject/i)).toHaveValue('');
    expect(screen.getByLabelText(/^message/i)).toHaveValue('');
  });

  /* ── API failure ────────────────────────────────────────── */
  test('shows error toast on API failure', async () => {
    mockCreateTicket.mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();

    render(<ContactForm />);
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });
});
