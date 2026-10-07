import { Navigate } from 'react-router-dom';
import useMe from './useMe.js';
import { Spinner } from '../components';

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useMe();

  if (isLoading) return <Spinner />;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}