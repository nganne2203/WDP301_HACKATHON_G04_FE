import { api } from './client';
import type {
  AuthData,
  ChangePasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  User,
} from './types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthData>('/auth/login', data, { auth: false }),

  googleLogin: (data: GoogleLoginRequest) =>
    api.post<AuthData>('/auth/google', data, { auth: false }),

  register: (data: RegisterRequest) =>
    api.post<User>('/auth/register', data, { auth: false }),

  refreshToken: (refreshToken: string) =>
    api.post<AuthData>('/auth/refresh-token', { refreshToken }, { auth: false }),

  getMe: () =>
    api.get<User>('/auth/me'),

  changePassword: (data: ChangePasswordRequest) =>
    api.post<User>('/auth/change-password', data),

  logout: () =>
    api.post<null>('/auth/logout'),
};
