import { Navigate, useLocation } from 'react-router-dom';
import { Fragment } from 'react';

function RouteGuard({
  authenticated,
  user,
  element,
  requireAuth = false,
  requireAdmin = false,
  storeOnly = false,
}) {
  const location = useLocation();
  const path = location.pathname;

  const isAuthPage = path.startsWith('/auth');
  const isAdmin = authenticated && user?.role === 'admin';

  // Not authenticated but route requires auth
  if (requireAuth && !authenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin-only route protection
  if (requireAdmin && (!authenticated || user?.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  // Authenticated users cannot access /auth
  if (authenticated && isAuthPage) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  }

  // Admins cannot access store-only pages — redirect to admin panel
  if (isAdmin && storeOnly) {
    return <Navigate to="/admin" replace />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
