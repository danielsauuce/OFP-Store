import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '../../src/components/NotificationBell';

/* ── Mocks ────────────────────────────────────────────────── */
const mockGetUnreadCountService = jest.fn();
jest.mock('../../src/services/notificationService', () => ({
  getUnreadCountService: (...args) => mockGetUnreadCountService(...args),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock socket.io-client
const mockSocketOn = jest.fn();
const mockSocketDisconnect = jest.fn();
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: mockSocketOn,
    disconnect: mockSocketDisconnect,
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no unread notifications
  mockGetUnreadCountService.mockResolvedValue({ success: true, count: 0 });
  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });
});

/* ═══════════════════════════════════════════════════════════ */
describe('NotificationBell', () => {
  test('renders bell icon button', async () => {
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notification/i });
    expect(button).toBeInTheDocument();
  });

  test('does not show badge when unread count is 0', async () => {
    mockGetUnreadCountService.mockResolvedValue({ success: true, count: 0 });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockGetUnreadCountService).toHaveBeenCalled();
    });

    // No badge span should exist
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  test('shows unread count badge when count is greater than 0', async () => {
    mockGetUnreadCountService.mockResolvedValue({ success: true, count: 5 });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  test('shows 99+ badge when count exceeds 99', async () => {
    mockGetUnreadCountService.mockResolvedValue({ success: true, count: 150 });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });

  test('clicking the bell navigates to /notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notification/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });

  test('does not throw when getUnreadCountService fails', async () => {
    mockGetUnreadCountService.mockRejectedValue(new Error('Network Error'));

    expect(() => render(<NotificationBell />)).not.toThrow();

    // Count stays 0 on error
    await waitFor(() => {
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });
  });
});
