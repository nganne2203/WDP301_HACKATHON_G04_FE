import { api } from './client';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
  AssignRolesRequest,
  ListUsersQuery,
  UserRoleName,
} from './types';

export const usersApi = {
  list: (query?: ListUsersQuery) =>
    api.get<User[]>('/users', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    api.post<User>('/users', data),

  update: (id: string, data: UpdateUserRequest) =>
    api.patch<User>(`/users/${id}`, data),

  updateProfile: (data: UpdateProfileRequest) =>
    api.patch<User>('/users/me', data),

  updateStatus: (id: string, status: string) =>
    api.patch<User>(`/users/${id}/status`, { status }),

  approve: (id: string) =>
    api.patch<User>(`/users/${id}/approve`),

  reject: (id: string) =>
    api.patch<User>(`/users/${id}/reject`),

  suspend: (id: string) =>
    api.patch<User>(`/users/${id}/suspend`),

  assignRoles: (id: string, roles: UserRoleName[]) =>
    api.patch<User>(`/users/${id}/roles`, { roles } as AssignRolesRequest),
};
