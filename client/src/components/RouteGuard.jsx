import { Navigate, useLocation } from 'react-router-dom';
import { Fragment } from 'react';

function RouteGuard({ authenticated, user, element, requireAuth = false, requireAdmin = false }) {
  const location = useLocation();

  if (requireAuth && !authenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && (!authenticated || user?.role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  if (authenticated && location.pathname === '/auth') {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
