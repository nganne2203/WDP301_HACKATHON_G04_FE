import { api } from './client';
import type {
  ApiSuccessResponse,
  Workshop,
  WorkshopQuestion,
  WorkshopRating,
  WorkshopFeedback,
  WorkshopRatingListData,
  WorkshopRatingStats,
  WorkshopRatingsResult,
} from './types';

export interface ListWorkshopsQuery {
  page?: number;
  limit?: number;
  eventId?: string;
  presenterId?: string;
  status?: string;
  search?: string;
}

export interface CreateWorkshopRequest {
  eventId: string;
  timelineEventId?: string;
  title: string;
  description?: string;
  presenterId?: string;
  speakerInfo?: {
    name?: string;
    title?: string;
    bio?: string;
    email?: string;
  };
  startTime: string;
  endTime: string;
  questionnaire?: string[];
  status?: string;
}

export type UpdateWorkshopRequest = Partial<CreateWorkshopRequest>;

export const workshopsApi = {
  list: (query?: ListWorkshopsQuery) =>
    api.get<Workshop[]>('/workshops', { params: query as Record<string, string | number | undefined> }),

  getById: (id: string) =>
    api.get<Workshop>(`/workshops/${id}`),

  create: (data: CreateWorkshopRequest) =>
    api.post<Workshop>('/workshops', data),

  update: (id: string, data: UpdateWorkshopRequest) =>
    api.patch<Workshop>(`/workshops/${id}`, data),

  delete: (id: string) =>
    api.delete<null>(`/workshops/${id}`),

  createGoogleMeet: (id: string, data: { organizerUserId: string; attendees?: string[] }) =>
    api.post<{ meetLink: string; calendarEventId: string }>(`/workshops/${id}/google-meet`, data),

  createQuestion: (id: string, data: { content: string }) =>
    api.post<WorkshopQuestion>(`/workshops/${id}/questions`, data),

  listQuestions: (id: string, query?: { page?: number; limit?: number }) =>
    api.get<WorkshopQuestion[]>(`/workshops/${id}/questions`, { params: query as Record<string, string | number | undefined> }),

  voteQuestion: (questionId: string) =>
    api.post<WorkshopQuestion>(`/workshops/questions/${questionId}/vote`),

  createRating: (id: string, data: { rating: number }) =>
    api.post<WorkshopRating>(`/workshops/${id}/ratings`, data),

  listRatings: (id: string, query?: { page?: number; limit?: number; mine?: boolean }) =>
    api.get<WorkshopRatingListData>(`/workshops/${id}/ratings`, {
      params: query as Record<string, string | number | boolean | undefined>,
    }),

  getRatingStats: async (id: string): Promise<ApiSuccessResponse<WorkshopRatingStats>> => {
    const response = await api.get<WorkshopRatingsResult>(`/workshops/${id}/ratings`, { params: { limit: 1 } });
    return {
      ...response,
      data: response.data.stats,
    };
  },

  createFeedback: (id: string, data: { comment: string }) =>
    api.post<WorkshopFeedback>(`/workshops/${id}/feedback`, data),

  listFeedback: (id: string, query?: { page?: number; limit?: number; mine?: boolean }) =>
    api.get<WorkshopFeedback[]>(`/workshops/${id}/feedback`, {
      params: query as Record<string, string | number | boolean | undefined>,
    }),
};
