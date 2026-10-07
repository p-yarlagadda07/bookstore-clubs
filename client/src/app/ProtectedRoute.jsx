import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useMe from './useMe.js';

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useMe();
  const location = useLocation();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children ?? <Outlet />;
}