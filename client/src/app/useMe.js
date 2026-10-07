import { useQuery } from '@tanstack/react-query';
import api from '../api/client.js';

export default function useMe() {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').catch(() => null),
    retry: false,
  });

  return { user: data?.user ?? null, isLoading };
}