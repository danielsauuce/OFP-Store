import { Navigate, useLocation } from 'react-router-dom';
import { Fragment } from 'react';

function RouteGuard({ authenticated, user, element, requireAuth = false, requireAdmin = false }) {
  const location = useLocation();
  const path = location.pathname;

  const isAuthPage = path.startsWith('/auth');
  const isRootPage = path === '/';

  // Not authenticated but route requires auth
  if (requireAuth && !authenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin-only route protection
  if (requireAdmin && (!authenticated || user?.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  // Authenticated users can not access /auth
  if (authenticated && isAuthPage) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }

  // Admin can not access /
  if (authenticated && user?.role === 'admin' && isRootPage) {
    return <Navigate to="/admin" replace />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
