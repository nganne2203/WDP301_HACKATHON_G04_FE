import { ApiError } from '@/shared/api/client';
import type { MediaHistoryFilter, MediaItem, MediaStatus, MediaType } from '@/shared/api/types';

export const MEDIA_TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'DOCUMENT'];
export const MEDIA_STATUSES: MediaStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm', 'pdf', 'doc', 'docx', 'ppt', 'pptx'];
export const MAX_SIZE_BY_TYPE: Record<MediaType, number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 200 * 1024 * 1024,
  DOCUMENT: 50 * 1024 * 1024,
};

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export const detectMediaType = (file: File): MediaType | null => {
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('video/')) return 'VIDEO';
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && ['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(extension)) return 'DOCUMENT';
  return null;
};

export const validateFile = (file: File | null) => {
  if (!file) return null;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return 'This file type is not allowed.';
  }

  const mediaType = detectMediaType(file);
  if (!mediaType) return 'The file MIME type is not supported.';

  if (file.size > MAX_SIZE_BY_TYPE[mediaType]) {
    return `${mediaType.toLowerCase()} files must be ${formatFileSize(MAX_SIZE_BY_TYPE[mediaType])} or smaller.`;
  }

  return null;
};

export const buildHistoryFilters = ({
  competitionId,
  mediaType,
  status,
  fromDate,
  toDate,
  week,
  month,
  year,
  page,
}: {
  competitionId: string;
  mediaType: string;
  status: string;
  fromDate: string;
  toDate: string;
  week: string;
  month: string;
  year: string;
  page: number;
}): MediaHistoryFilter => ({
  competitionId: competitionId === 'ALL' ? undefined : competitionId,
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

export function getMediaErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return fallback;
}

export const canDeleteMedia = (media: MediaItem, userId?: string) =>
  media.status === 'PENDING' && (!media.uploadedById || media.uploadedById === userId);
