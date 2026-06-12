import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { authApi } from '@/shared/api/auth';
import { clearTokens, getAccessToken } from '@/shared/api/client';
import type { User } from '@/shared/api/types';
import { queryKeys } from '@/lib/queryKeys';

async function fetchCurrentUser(): Promise<User | null> {
  if (!getAccessToken()) return null;

  try {
    const response = await authApi.getMe();
    return response.data;
  } catch {
    clearTokens();
    return null;
  }
}

export function useAuthBootstrapQuery() {
  const setUser = useStore((state) => state.setUser);
  const setAuthLoading = useStore((state) => state.setAuthLoading);

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!query.isSuccess) return;
    setUser(query.data);
    setAuthLoading(false);
  }, [query.data, query.isSuccess, setAuthLoading, setUser]);

  return query;
}
