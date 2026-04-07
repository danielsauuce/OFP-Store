import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../../src/components/NotificationBell';

/* ── Mocks ────────────────────────────────────────────────── */
let mockUnreadCount = 0;
jest.mock('../../src/context/notificationContext', () => ({
  useNotifications: () => ({
    unreadCount: mockUnreadCount,
    refreshCount: jest.fn(),
    decrementCount: jest.fn(),
    resetCount: jest.fn(),
  }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no unread notifications
  mockUnreadCount = 0;
});

/* ═══════════════════════════════════════════════════════════ */
describe('NotificationBell', () => {
  test('renders bell icon button', async () => {
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notification/i });
    expect(button).toBeInTheDocument();
  });

  test('does not show badge when unread count is 0', () => {
    mockUnreadCount = 0;

    render(<NotificationBell />);

    // No badge span should exist
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  test('shows unread count badge when count is greater than 0', () => {
    mockUnreadCount = 5;

    render(<NotificationBell />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('shows 99+ badge when count exceeds 99', () => {
    mockUnreadCount = 150;

    render(<NotificationBell />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  test('clicking the bell navigates to /notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notification/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });

  test('does not throw when context is unavailable', () => {
    mockUnreadCount = 0;

    expect(() => render(<NotificationBell />)).not.toThrow();

    // Count stays 0
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });
});
