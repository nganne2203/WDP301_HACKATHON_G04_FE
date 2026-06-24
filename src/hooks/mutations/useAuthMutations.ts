import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useStore } from '@/entities/session/model/store';
import { authApi } from '@/shared/api/auth';
import { clearTokens, getAccessToken } from '@/shared/api/client';
import type { GoogleLoginRequest, GoogleRegisterRequest, LoginRequest } from '@/shared/api/types';
import { queryKeys } from '@/lib/queryKeys';

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAuth = useStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      const { user, tokens } = response.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      queryClient.setQueryData(queryKeys.auth.me(), user);
    },
  });
}

export function useGoogleSignInMutation() {
  const queryClient = useQueryClient();
  const setAuth = useStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: GoogleLoginRequest) => authApi.googleLogin(data),
    onSuccess: (response) => {
      const { user, tokens } = response.data;
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      queryClient.setQueryData(queryKeys.auth.me(), user);
    },
  });
}

export function useGoogleRegisterMutation() {
  return useMutation({
    mutationFn: (data: GoogleRegisterRequest) => authApi.googleRegister(data),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const setUser = useStore((state) => state.setUser);
  const setAuthLoading = useStore((state) => state.setAuthLoading);

  return useMutation({
    mutationFn: async () => {
      if (getAccessToken()) {
        await authApi.logout();
      }
    },
    onSettled: () => {
      clearTokens();
      setUser(null);
      setAuthLoading(false);
      queryClient.clear();
    },
  });
}
