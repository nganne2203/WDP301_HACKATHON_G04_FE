import { ApiError } from '@/shared/api/client';
import type { AdminMediaFilter, MediaStatus, MediaType } from '@/shared/api/types';

export const ADMIN_MEDIA_TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'DOCUMENT'];
export const ADMIN_MEDIA_STATUSES: MediaStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export const buildAdminMediaFilters = ({
  eventId,
  uploadedBy,
  teamId,
  mediaType,
  status,
  fromDate,
  toDate,
  week,
  month,
  year,
  page,
}: {
  eventId: string;
  uploadedBy: string;
  teamId: string;
  mediaType: string;
  status: string;
  fromDate: string;
  toDate: string;
  week: string;
  month: string;
  year: string;
  page: number;
}): AdminMediaFilter => ({
  eventId: eventId === 'ALL' ? undefined : eventId,
  uploadedBy: uploadedBy || undefined,
  teamId: teamId || undefined,
  mediaType: mediaType === 'ALL' ? undefined : mediaType as MediaType,
  status: status === 'ALL' ? undefined : status as MediaStatus,
  fromDate: fromDate || undefined,
  toDate: toDate || undefined,
  week: week ? Number(week) : undefined,
  month: month ? Number(month) : undefined,
  year: year ? Number(year) : undefined,
  page,
  limit: 10,
});

export function getAdminMediaErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return fallback;
}
