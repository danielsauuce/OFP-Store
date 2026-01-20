import { Navigate, useLocation } from 'react-router-dom';
import { Fragment } from 'react';

function RouteGuard({ authenticated, user, element }) {
  const location = useLocation();

  console.log(authenticated, user, 'useruser');

  if (!authenticated && !location.pathname.includes('/admin')) {
    return <Navigate to="/auth" />;
  }

  if (
    authenticated &&
    user?.role !== 'admin' &&
    (location.pathname.includes('admin') || location.pathname.includes('/auth'))
  ) {
    return <Navigate to="/" />;
  }

  if (authenticated && user.role === 'admin' && !location.pathname.includes('admin')) {
    return <Navigate to="/admin" />;
  }

  return <Fragment>{element}</Fragment>;
}

export default RouteGuard;
