import { Navigate, useLocation } from 'react-router-dom';
import { Fragment } from 'react';

function RouteGuard({ authenticated, user, element, requireAuth = false, requireAdmin = false }) {
  const location = useLocation();
  const path = location.pathname;
  const isAuthPage = path.startsWith('/auth');

  // Route requires authentication
  if (requireAuth && !authenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Route requires admin
  if (requireAdmin && (!authenticated || user?.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  // Authenticated users cannot access auth pages
  if (authenticated && isAuthPage) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
