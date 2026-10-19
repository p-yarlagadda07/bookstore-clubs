import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import useMe from './useMe.js';
import { EmptyState } from '../components/index.js';

export default function ProtectedRoute({ roles, children }) {
  const { user, isLoading } = useMe();
  const location = useLocation();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // the server already blocks the data, this just shows a clear page instead of an error
  const userRoles = user.roles ?? [];
  if (roles && !userRoles.includes('admin') && !roles.some((role) => userRoles.includes(role))) {
    return (
      <EmptyState title="Not allowed" message="This page is only for store staff.">
        <Link to="/">Back to Smart Search</Link>
      </EmptyState>
    );
  }

  return children ?? <Outlet />;
}
