import { ApiError } from '@/shared/api/client';
import type { Repository } from '@/shared/api/types';

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Could not connect to server.';
}

export function accessVariant(state: Repository['accessState']) {
  if (state === 'GRANTED') return 'default' as const;
  if (state === 'PENDING') return 'secondary' as const;
  if (state === 'REVOKED') return 'destructive' as const;
  return 'outline' as const;
}

export function webhookVariant(status: Repository['webhookStatus']) {
  if (status === 'REGISTERED') return 'default' as const;
  if (status === 'FAILED') return 'destructive' as const;
  if (status === 'PENDING') return 'secondary' as const;
  return 'outline' as const;
}

export function statusVariant(status: Repository['status']) {
  if (status === 'ACTIVE') return 'default' as const;
  if (status === 'ARCHIVED') return 'secondary' as const;
  if (status === 'DISCONNECTED') return 'destructive' as const;
  return 'outline' as const;
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

export function shortSha(value?: string | null) {
  return value ? value.slice(0, 8) : '-';
}
