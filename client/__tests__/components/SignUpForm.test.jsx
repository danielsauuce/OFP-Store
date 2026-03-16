import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignUpForm from '../../src/components/SignUpForm';

/* ── Mocks ────────────────────────────────────────────────── */
jest.mock('gsap', () => ({
  __esModule: true,
  default: { fromTo: jest.fn() },
}));

/* ═══════════════════════════════════════════════════════════ */
describe('SignUpForm', () => {
  let handleSignUp;

  beforeEach(() => {
    handleSignUp = jest.fn();
  });

  /* ── Rendering ──────────────────────────────────────────── */
  test('renders all three input fields', () => {
    render(<SignUpForm handleSignUp={handleSignUp} />);

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('renders Create Account button', () => {
    render(<SignUpForm handleSignUp={handleSignUp} />);

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('renders Terms and Privacy Policy links', () => {
    render(<SignUpForm handleSignUp={handleSignUp} />);

    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  /* ── Button disabled state ──────────────────────────────── */
  test('submit button is disabled when fields are empty', () => {
    render(<SignUpForm handleSignUp={handleSignUp} />);

    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  test('submit button becomes enabled when all fields filled', async () => {
    const user = userEvent.setup();
    render(<SignUpForm handleSignUp={handleSignUp} />);

    await user.type(screen.getByLabelText('Full Name'), 'Daniel');
    await user.type(screen.getByLabelText('Email Address'), 'dan@test.com');
    await user.type(screen.getByLabelText('Password'), 'Pass1234');

    expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled();
  });

  /* ── Validation ─────────────────────────────────────────── */
  test('shows error for name shorter than 2 characters', () => {
    render(<SignUpForm handleSignUp={handleSignUp} />);

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'A', name: 'fullName' },
    });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'dan@test.com', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Pass1234', name: 'password' },
    });

    const form = screen.getByLabelText('Full Name').closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    expect(handleSignUp).not.toHaveBeenCalled();
  });

  test('shows error for invalid email', () => {
    render(<SignUpForm handleSignUp={handleSignUp} />);

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Daniel', name: 'fullName' },
    });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'not-email', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Pass1234', name: 'password' },
    });

    const form = screen.getByLabelText('Full Name').closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    expect(handleSignUp).not.toHaveBeenCalled();
  });

  test('shows error for password shorter than 8 characters', () => {
    render(<SignUpForm handleSignUp={handleSignUp} />);

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Daniel', name: 'fullName' },
    });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'dan@test.com', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'short', name: 'password' },
    });

    const form = screen.getByLabelText('Full Name').closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(handleSignUp).not.toHaveBeenCalled();
  });

  test('clears field error when user types in that field', async () => {
    const user = userEvent.setup();
    render(<SignUpForm handleSignUp={handleSignUp} />);

    // Trigger error
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'A', name: 'fullName' },
    });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'dan@test.com', name: 'email' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Pass1234', name: 'password' },
    });
    const form = screen.getByLabelText('Full Name').closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();

    // Type in the field — error should clear
    await user.clear(screen.getByLabelText('Full Name'));
    await user.type(screen.getByLabelText('Full Name'), 'Daniel');

    expect(screen.queryByText(/name must be at least 2 characters/i)).not.toBeInTheDocument();
  });

  /* ── Successful submit ──────────────────────────────────── */
  test('calls handleSignUp with validated data on valid submit', async () => {
    const user = userEvent.setup();
    render(<SignUpForm handleSignUp={handleSignUp} />);

    await user.type(screen.getByLabelText('Full Name'), 'Daniel Olayinka');
    await user.type(screen.getByLabelText('Email Address'), 'dan@test.com');
    await user.type(screen.getByLabelText('Password'), 'Pass1234');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(handleSignUp).toHaveBeenCalledTimes(1);
    expect(handleSignUp).toHaveBeenCalledWith({
      fullName: 'Daniel Olayinka',
      email: 'dan@test.com',
      password: 'Pass1234',
    });
  });
});
