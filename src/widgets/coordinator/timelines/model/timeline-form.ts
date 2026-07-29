import type {
  CreateTimelineRequest,
  TimelineActivity,
  TimelineActivityType,
  TimelineStatus,
  UpdateTimelineRequest,
} from '@/shared/api/types';
import { ApiError } from '@/shared/api/client';

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

export function getTimelineDateTimeMin() {
  const nextMinute = new Date();
  nextMinute.setSeconds(0, 0);
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);
  const timezoneOffset = nextMinute.getTimezoneOffset() * 60000;
  return new Date(nextMinute.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function validateNewTimelineSchedule(form: TimelineFormState) {
  const now = new Date();
  const start = form.startTime ? new Date(form.startTime) : null;
  const end = form.endTime ? new Date(form.endTime) : null;

  if (start && start < now) {
    throw new ApiError({ success: false, code: 'VALIDATION_ERROR', message: 'Start time cannot be in the past', errors: ['Start time cannot be in the past.'] }, 400);
  }
  if (end && end < now) {
    throw new ApiError({ success: false, code: 'VALIDATION_ERROR', message: 'End time cannot be in the past', errors: ['End time cannot be in the past.'] }, 400);
  }
  if (start && end && end < start) {
    throw new ApiError({ success: false, code: 'VALIDATION_ERROR', message: 'End time cannot be earlier than start time', errors: ['End time cannot be earlier than start time.'] }, 400);
  }
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
  validateNewTimelineSchedule(form);
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
