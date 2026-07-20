import { ApiError } from '@/shared/api/client';
import type { AdminMediaFilter, MediaStatus, MediaType } from '@/shared/api/types';

export const ADMIN_MEDIA_TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'DOCUMENT'];
export const ADMIN_MEDIA_STATUSES: MediaStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export const buildAdminMediaFilters = ({
  competitionId,
  mediaType,
  status,
  fromDate,
  toDate,
  page,
}: {
  competitionId: string;
  mediaType: string;
  status: string;
  fromDate: string;
  toDate: string;
  page: number;
}): AdminMediaFilter => ({
  competitionId: competitionId === 'ALL' ? undefined : competitionId,
  mediaType: mediaType === 'ALL' ? undefined : mediaType as MediaType,
  status: status === 'ALL' ? undefined : status as MediaStatus,
  fromDate: fromDate || undefined,
  toDate: toDate || undefined,
  page,
  limit: 10,
});

export function getAdminMediaErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return fallback;
}
