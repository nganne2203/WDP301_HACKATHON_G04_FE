import type {
  CreateTimelineRequest,
  TimelineActivity,
  TimelineActivityType,
  TimelineStatus,
  UpdateTimelineRequest,
} from '@/shared/api/types';

export const timelineTypeOptions: TimelineActivityType[] = ['WORKSHOP', 'CHECK_IN', 'ROUND', 'RESULT_PUBLISHING', 'CEREMONY', 'OTHER'];
export const timelineStatusOptions: TimelineStatus[] = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export interface TimelineFormState {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  activityType: TimelineActivityType;
  status: TimelineStatus;
}

export function createEmptyTimelineForm(): TimelineFormState {
  return {
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    activityType: 'OTHER',
    status: 'SCHEDULED',
  };
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toDateTimeInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toApiDateTimeValue(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function mapTimelineToForm(timeline: TimelineActivity): TimelineFormState {
  return {
    title: timeline.title,
    description: timeline.description || '',
    startTime: toDateTimeInputValue(timeline.startTime),
    endTime: toDateTimeInputValue(timeline.endTime),
    activityType: timeline.activityType,
    status: timeline.status,
  };
}

export function buildTimelinePayload(form: TimelineFormState, competitionId: string): CreateTimelineRequest {
  return {
    competitionId,
    title: form.title.trim(),
    description: normalizeOptionalText(form.description),
    startTime: toApiDateTimeValue(form.startTime),
    endTime: toApiDateTimeValue(form.endTime),
    activityType: form.activityType,
    status: form.status,
  };
}

export function buildTimelineUpdatePayload(form: TimelineFormState): UpdateTimelineRequest {
  return {
    title: form.title.trim(),
    description: normalizeOptionalText(form.description),
    startTime: form.startTime ? toApiDateTimeValue(form.startTime) : undefined,
    endTime: form.endTime ? toApiDateTimeValue(form.endTime) : undefined,
    activityType: form.activityType,
    status: form.status,
  };
}

export function formatTimelineType(type: TimelineActivityType) {
  return type.replaceAll('_', ' ');
}
