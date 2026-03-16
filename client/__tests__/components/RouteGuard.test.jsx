import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RouteGuard from '../../src/components/RouteGuard';

/* Helper — renders RouteGuard inside a MemoryRouter at a given path */
const renderGuard = (props, initialPath = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <RouteGuard {...props} />
    </MemoryRouter>,
  );
};

/* ═══════════════════════════════════════════════════════════ */
describe('RouteGuard', () => {
  /* ── Public routes (no auth required) ───────────────────── */
  test('renders element when no auth is required', () => {
    renderGuard({
      authenticated: false,
      user: null,
      element: <div>Public Page</div>,
    });

    expect(screen.getByText('Public Page')).toBeInTheDocument();
  });

  test('renders element for authenticated user on public route', () => {
    renderGuard(
      {
        authenticated: true,
        user: { fullName: 'Daniel', role: 'customer' },
        element: <div>Shop Page</div>,
      },
      '/shop',
    );

    expect(screen.getByText('Shop Page')).toBeInTheDocument();
  });

  /* ── requireAuth routes ─────────────────────────────────── */
  test('redirects to /auth when requireAuth and not authenticated', () => {
    renderGuard(
      {
        authenticated: false,
        user: null,
        element: <div>Protected Page</div>,
        requireAuth: true,
      },
      '/orders',
    );

    expect(screen.queryByText('Protected Page')).not.toBeInTheDocument();
  });

  test('renders element when requireAuth and authenticated', () => {
    renderGuard(
      {
        authenticated: true,
        user: { fullName: 'Daniel', role: 'customer' },
        element: <div>My Orders</div>,
        requireAuth: true,
      },
      '/orders',
    );

    expect(screen.getByText('My Orders')).toBeInTheDocument();
  });

  /* ── requireAdmin routes ────────────────────────────────── */
  test('redirects non-admin away from admin routes', () => {
    renderGuard(
      {
        authenticated: true,
        user: { fullName: 'Daniel', role: 'customer' },
        element: <div>Admin Dashboard</div>,
        requireAdmin: true,
      },
      '/admin',
    );

    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  test('redirects unauthenticated user away from admin routes', () => {
    renderGuard(
      {
        authenticated: false,
        user: null,
        element: <div>Admin Dashboard</div>,
        requireAdmin: true,
      },
      '/admin',
    );

    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  test('renders admin page for admin user', () => {
    renderGuard(
      {
        authenticated: true,
        user: { fullName: 'Admin', role: 'admin' },
        element: <div>Admin Dashboard</div>,
        requireAdmin: true,
      },
      '/admin',
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  /* ── Auth page redirect (authenticated users can't access /auth) */
  test('redirects authenticated customer away from /auth', () => {
    renderGuard(
      {
        authenticated: true,
        user: { fullName: 'Daniel', role: 'customer' },
        element: <div>Auth Page</div>,
      },
      '/auth',
    );

    expect(screen.queryByText('Auth Page')).not.toBeInTheDocument();
  });

  test('redirects authenticated admin away from /auth', () => {
    renderGuard(
      {
        authenticated: true,
        user: { fullName: 'Admin', role: 'admin' },
        element: <div>Auth Page</div>,
      },
      '/auth',
    );

    expect(screen.queryByText('Auth Page')).not.toBeInTheDocument();
  });

  /* ── Admin root redirect (admin can't access /) ─────────── */
  test('redirects admin away from root / page', () => {
    renderGuard(
      {
        authenticated: true,
        user: { fullName: 'Admin', role: 'admin' },
        element: <div>Home Page</div>,
      },
      '/',
    );

    expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
  });

  test('allows customer to access root / page', () => {
    renderGuard(
      {
        authenticated: true,
        user: { fullName: 'Daniel', role: 'customer' },
        element: <div>Home Page</div>,
      },
      '/',
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
