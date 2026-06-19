import { api } from './client';
import type {
  ListPermissionsQuery,
  Permission,
  PermissionGroup,
  UpdatePermissionRequest,
} from './types';

export const permissionsApi = {
  list: (query?: ListPermissionsQuery) =>
    api.get<Permission[]>('/permissions', { params: query as Record<string, string | number | boolean | undefined> }),

  grouped: () =>
    api.get<PermissionGroup[]>('/permissions/grouped'),

  getById: (id: string) =>
    api.get<Permission>(`/permissions/${id}`),

  update: (id: string, data: UpdatePermissionRequest) =>
    api.patch<Permission>(`/permissions/${id}`, data),
};
