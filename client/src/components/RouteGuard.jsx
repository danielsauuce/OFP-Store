import { Navigate, useLocation } from 'react-router-dom';
import { Fragment } from 'react';

function RouteGuard({ authenticated, user, element, requireAuth = false, requireAdmin = false }) {
  const location = useLocation();
  const path = location.pathname;
  const isAuthPage = path.startsWith('/auth');

  if (requireAuth && !authenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && (!authenticated || user?.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  if (authenticated && isAuthPage) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
