import { api } from './client';
import type {
  CreateRoleRequest,
  ListRolesQuery,
  Role,
  RolePermissionsResult,
  UpdateRoleRequest,
} from './types';

export const rolesApi = {
  list: (query?: ListRolesQuery) =>
    api.get<Role[]>('/roles', { params: query as Record<string, string | number | boolean | undefined> }),

  getById: (id: string) =>
    api.get<Role>(`/roles/${id}`),

  create: (data: CreateRoleRequest) =>
    api.post<Role>('/roles', data),

  update: (id: string, data: UpdateRoleRequest) =>
    api.patch<Role>(`/roles/${id}`, data),

  delete: (id: string) =>
    api.delete<{ id: string; name: string; deleted: boolean }>(`/roles/${id}`),

  getPermissions: (id: string) =>
    api.get<RolePermissionsResult>(`/roles/${id}/permissions`),

  setPermissions: (id: string, permissions: string[]) =>
    api.put<RolePermissionsResult>(`/roles/${id}/permissions`, { permissions }),

  addPermissions: (id: string, permissions: string[]) =>
    api.post<RolePermissionsResult>(`/roles/${id}/permissions`, { permissions }),

  removePermission: (id: string, permissionId: string) =>
    api.delete<RolePermissionsResult>(`/roles/${id}/permissions/${permissionId}`),
};
