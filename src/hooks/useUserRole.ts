import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useUserRole = () => {
  const { currentUser } = useAuth();

  const isProvider = useMemo(() => currentUser?.role === 'provider', [currentUser]);
  const isRenter = useMemo(() => currentUser?.role === 'renter', [currentUser]);

  return {
    role: currentUser?.role || null,
    isProvider,
    isRenter,
  };
};

export default useUserRole;
