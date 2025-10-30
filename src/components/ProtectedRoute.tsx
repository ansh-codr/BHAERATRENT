import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'provider' | 'renter';
}

export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.role) {
    return <Navigate to="/onboarding" replace />;
  }

  if (requireRole && currentUser.role !== requireRole) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  return <>{children}</>;
};
