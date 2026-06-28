import type {
  CreateTimelineRequest,
  TimelineEvent,
  TimelineEventType,
  TimelineStatus,
  UpdateTimelineRequest,
} from '@/shared/api/types';

export const timelineTypeOptions: TimelineEventType[] = ['WORKSHOP', 'CHECK_IN', 'ROUND', 'RESULT_PUBLISHING', 'CEREMONY', 'OTHER'];
export const timelineStatusOptions: TimelineStatus[] = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export interface TimelineFormState {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  eventType: TimelineEventType;
  status: TimelineStatus;
}

export function createEmptyTimelineForm(): TimelineFormState {
  return {
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    eventType: 'OTHER',
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

export function mapTimelineToForm(timeline: TimelineEvent): TimelineFormState {
  return {
    title: timeline.title,
    description: timeline.description || '',
    startTime: toDateTimeInputValue(timeline.startTime),
    endTime: toDateTimeInputValue(timeline.endTime),
    eventType: timeline.eventType,
    status: timeline.status,
  };
}

export function buildTimelinePayload(form: TimelineFormState, eventId: string): CreateTimelineRequest {
  return {
    eventId,
    title: form.title.trim(),
    description: normalizeOptionalText(form.description),
    startTime: toApiDateTimeValue(form.startTime),
    endTime: toApiDateTimeValue(form.endTime),
    eventType: form.eventType,
    status: form.status,
  };
}

export function buildTimelineUpdatePayload(form: TimelineFormState): UpdateTimelineRequest {
  return {
    title: form.title.trim(),
    description: normalizeOptionalText(form.description),
    startTime: form.startTime ? toApiDateTimeValue(form.startTime) : undefined,
    endTime: form.endTime ? toApiDateTimeValue(form.endTime) : undefined,
    eventType: form.eventType,
    status: form.status,
  };
}

export function formatTimelineType(type: TimelineEventType) {
  return type.replaceAll('_', ' ');
}
