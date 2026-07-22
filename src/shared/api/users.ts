import { api, API_BASE_URL, ApiError, getAccessToken } from './client';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
  AssignRolesRequest,
  ListUsersQuery,
  UserRoleName,
} from './types';

const parseJson = <T>(value: string): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

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

  uploadAvatar: (formData: FormData, onProgress?: (progress: number) => void) =>
    new Promise<ApiSuccessResponse<User>>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('POST', `${API_BASE_URL}/users/me/avatar`);

      const token = getAccessToken();
      if (token) {
        request.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      request.upload.onprogress = (competition) => {
        if (!competition.lengthComputable || !onProgress) return;
        onProgress(Math.round((competition.loaded / competition.total) * 100));
      };

      request.onload = () => {
        const success = parseJson<ApiSuccessResponse<User>>(request.responseText);
        if (request.status >= 200 && request.status < 300 && success?.success) {
          resolve(success);
          return;
        }

        const error = parseJson<ApiErrorResponse>(request.responseText) || {
          success: false,
          code: 'UPLOAD_FAILED',
          message: 'Avatar upload failed',
          errors: [],
        };
        reject(new ApiError(error, request.status));
      };

      request.onerror = () => {
        reject(new Error('Avatar upload failed because the network request could not complete.'));
      };

      request.send(formData);
    }),

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
