import { api, API_BASE_URL, ApiError, getAccessToken } from './client';
import type {
  AdminMediaFilter,
  ApiErrorResponse,
  ApiSuccessResponse,
  CompetitionGalleryFilter,
  CompetitionGalleryResponse,
  MediaHistoryFilter,
  MediaItem,
  MediaStatistics,
  MediaStatisticsFilter,
  SignedUrlResponse,
} from './types';

const parseJson = <T>(value: string): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const mediaApi = {
  upload: (formData: FormData, onProgress?: (progress: number) => void) => {
    return new Promise<ApiSuccessResponse<MediaItem>>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('POST', `${API_BASE_URL}/media/upload`);

      const token = getAccessToken();
      if (token) {
        request.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      request.upload.onprogress = (competition) => {
        if (!competition.lengthComputable || !onProgress) return;
        onProgress(Math.round((competition.loaded / competition.total) * 100));
      };

      request.onload = () => {
        const success = parseJson<ApiSuccessResponse<MediaItem>>(request.responseText);
        if (request.status >= 200 && request.status < 300 && success?.success) {
          resolve(success);
          return;
        }

        const error = parseJson<ApiErrorResponse>(request.responseText) || {
          success: false,
          code: 'UPLOAD_FAILED',
          message: 'Media upload failed',
          errors: [],
        };
        reject(new ApiError(error, request.status));
      };

      request.onerror = () => {
        reject(new Error('Media upload failed because the network request could not complete.'));
      };

      request.send(formData);
    });
  },

  getMyHistory: (filters?: MediaHistoryFilter) =>
    api.get<MediaItem[]>('/media/my-history', { params: filters as Record<string, string | number | undefined> }),

  getCompetitionGallery: (competitionId: string, filters?: CompetitionGalleryFilter) =>
    api.get<CompetitionGalleryResponse>(`/competitions/${competitionId}/gallery`, { params: filters as Record<string, string | number | undefined> }),

  getViewUrl: (mediaId: string) =>
    api.get<SignedUrlResponse>(`/media/${mediaId}/view-url`),

  delete: (mediaId: string) =>
    api.delete<null>(`/media/${mediaId}`),

  getAdminMedia: (filters?: AdminMediaFilter) =>
    api.get<MediaItem[]>('/admin/media', { params: filters as Record<string, string | number | undefined> }),

  approve: (mediaId: string) =>
    api.patch<MediaItem>(`/admin/media/${mediaId}/approve`),

  reject: (mediaId: string, reason: string) =>
    api.patch<MediaItem>(`/admin/media/${mediaId}/reject`, { reason }),

  getStatistics: (filters?: MediaStatisticsFilter) =>
    api.get<MediaStatistics>('/admin/media/statistics', { params: filters as Record<string, string | number | undefined> }),
};
