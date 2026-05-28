import { api } from './client';
import type {
  AuthData,
  LoginRequest,
  RegisterRequest,
  User,
} from './types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthData>('/auth/login', data, { auth: false }),

  register: (data: RegisterRequest) =>
    api.post<User>('/auth/register', data, { auth: false }),

  refreshToken: (refreshToken: string) =>
    api.post<AuthData>('/auth/refresh-token', { refreshToken }, { auth: false }),

  getMe: () =>
    api.get<User>('/auth/me'),

  logout: () =>
    api.post<null>('/auth/logout'),

  /** Returns the URL to redirect the user to for Google OAuth login */
  getGoogleLoginUrl: () =>
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/auth/google`,
};
