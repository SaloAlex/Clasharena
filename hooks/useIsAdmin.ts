import { useAuth } from './useAuth';

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.email === 'dvdsalomon6@gmail.com';
}
