import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../../src/components/LoginForm';

/* ── Mocks ────────────────────────────────────────────────── */
jest.mock('gsap', () => ({
  __esModule: true,
  default: { fromTo: jest.fn() },
}));

/* ═══════════════════════════════════════════════════════════ */
describe('LoginForm', () => {
  let handleLogin;

  beforeEach(() => {
    handleLogin = jest.fn();
  });

  /* ── Rendering ──────────────────────────────────────────── */
  test('renders email and password fields', () => {
    render(<LoginForm handleLogin={handleLogin} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('renders Login button', () => {
    render(<LoginForm handleLogin={handleLogin} />);

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('renders Forgot password link', () => {
    render(<LoginForm handleLogin={handleLogin} />);

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  /* ── Button disabled state ──────────────────────────────── */
  test('submit button is disabled when fields are empty', () => {
    render(<LoginForm handleLogin={handleLogin} />);

    const btn = screen.getByRole('button', { name: /login/i });
    expect(btn).toBeDisabled();
  });

  test('submit button becomes enabled when both fields are filled', async () => {
    const user = userEvent.setup();
    render(<LoginForm handleLogin={handleLogin} />);

    await user.type(screen.getByLabelText('Email'), 'dan@test.com');
    await user.type(screen.getByLabelText('Password'), 'Pass123!');

    expect(screen.getByRole('button', { name: /login/i })).toBeEnabled();
  });

  /* ── Input handling ─────────────────────────────────────── */
  test('updates input values as user types', async () => {
    const user = userEvent.setup();
    render(<LoginForm handleLogin={handleLogin} />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    await user.type(emailInput, 'test@mail.com');
    await user.type(passwordInput, 'secret');

    expect(emailInput).toHaveValue('test@mail.com');
    expect(passwordInput).toHaveValue('secret');
  });

  /* ── Validation ─────────────────────────────────────────── */
  test('shows validation error when password is empty and submitted via fireEvent', () => {
    render(<LoginForm handleLogin={handleLogin} />);

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'dan@test.com', name: 'email' } });

    const form = emailInput.closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(handleLogin).not.toHaveBeenCalled();
  });

  test('does not call handleLogin when email field is empty', () => {
    render(<LoginForm handleLogin={handleLogin} />);

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'Pass123!', name: 'password' },
    });

    const form = screen.getByLabelText('Email').closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(handleLogin).not.toHaveBeenCalled();
  });

  test('clears field error when user starts typing in that field', async () => {
    const user = userEvent.setup();
    render(<LoginForm handleLogin={handleLogin} />);

    // Trigger validation error — submit with only email
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'dan@test.com', name: 'email' } });

    const form = emailInput.closest('form');
    fireEvent.submit(form);

    expect(screen.getByText(/password is required/i)).toBeInTheDocument();

    // Now type in password — error should clear
    await user.type(screen.getByLabelText('Password'), 'Pass123!');

    expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
  });

  /* ── Successful submit ──────────────────────────────────── */
  test('calls handleLogin with validated data on valid submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm handleLogin={handleLogin} />);

    await user.type(screen.getByLabelText('Email'), 'dan@test.com');
    await user.type(screen.getByLabelText('Password'), 'Pass123!');

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(handleLogin).toHaveBeenCalledTimes(1);
    expect(handleLogin).toHaveBeenCalledWith({
      email: 'dan@test.com',
      password: 'Pass123!',
    });
  });
});
