import type { TimelineActivity, User, Workshop, WorkshopStatus } from '@/shared/api/types';
import type { CreateWorkshopRequest, UpdateWorkshopRequest } from '@/shared/api/workshops';

export const workshopStatusOptions: WorkshopStatus[] = ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'];
const workshopPresenterRoles = new Set(['SPEAKER', 'MENTOR']);
const workshopPresenterPermissions = new Set(['WORKSHOP_MEET_CREATE']);
const eligiblePresenterStatuses = new Set(['ACTIVE']);

export interface WorkshopFormState {
  timelineActivityId: string;
  title: string;
  description: string;
  presenterId: string;
  speakerName: string;
  speakerTitle: string;
  speakerEmail: string;
  speakerBio: string;
  meetLink: string;
  startTime: string;
  endTime: string;
  questionnaire: string;
  status: WorkshopStatus;
}

export function createEmptyWorkshopForm(): WorkshopFormState {
  return {
    timelineActivityId: 'none',
    title: '',
    description: '',
    presenterId: '',
    speakerName: '',
    speakerTitle: '',
    speakerEmail: '',
    speakerBio: '',
    meetLink: '',
    startTime: '',
    endTime: '',
    questionnaire: '',
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
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function parseQuestionnaire(value: string) {
  const items = value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(items));
}

export function mapWorkshopToForm(workshop: Workshop): WorkshopFormState {
  return {
    timelineActivityId: workshop.timelineActivityId || 'none',
    title: workshop.title,
    description: workshop.description || '',
    presenterId: workshop.presenterId || '',
    speakerName: workshop.speakerInfo?.name || '',
    speakerTitle: workshop.speakerInfo?.title || '',
    speakerEmail: workshop.speakerInfo?.email || '',
    speakerBio: workshop.speakerInfo?.bio || '',
    meetLink: workshop.meetLink || '',
    startTime: toDateTimeInputValue(workshop.startTime),
    endTime: toDateTimeInputValue(workshop.endTime),
    questionnaire: (workshop.questionnaire || []).join('\n'),
    status: workshop.status,
  };
}

export function buildWorkshopPayload(form: WorkshopFormState, competitionId: string): CreateWorkshopRequest {
  return {
    competitionId,
    timelineActivityId: form.timelineActivityId === 'none' ? undefined : form.timelineActivityId,
    title: form.title.trim(),
    description: normalizeOptionalText(form.description) || undefined,
    presenterId: normalizeOptionalText(form.presenterId) || undefined,
    speakerInfo: {
      name: normalizeOptionalText(form.speakerName) || undefined,
      title: normalizeOptionalText(form.speakerTitle) || undefined,
      email: normalizeOptionalText(form.speakerEmail) || undefined,
      bio: normalizeOptionalText(form.speakerBio) || undefined,
    },
    meetLink: normalizeOptionalText(form.meetLink) || undefined,
    startTime: toApiDateTimeValue(form.startTime),
    endTime: toApiDateTimeValue(form.endTime),
    questionnaire: parseQuestionnaire(form.questionnaire),
    status: form.status,
  };
}

export function buildWorkshopUpdatePayload(form: WorkshopFormState): UpdateWorkshopRequest {
  return {
    timelineActivityId: form.timelineActivityId === 'none' ? undefined : form.timelineActivityId,
    title: form.title.trim(),
    description: normalizeOptionalText(form.description) || undefined,
    presenterId: normalizeOptionalText(form.presenterId) || undefined,
    speakerInfo: {
      name: normalizeOptionalText(form.speakerName) || undefined,
      title: normalizeOptionalText(form.speakerTitle) || undefined,
      email: normalizeOptionalText(form.speakerEmail) || undefined,
      bio: normalizeOptionalText(form.speakerBio) || undefined,
    },
    meetLink: normalizeOptionalText(form.meetLink) || undefined,
    startTime: form.startTime ? toApiDateTimeValue(form.startTime) : undefined,
    endTime: form.endTime ? toApiDateTimeValue(form.endTime) : undefined,
    questionnaire: parseQuestionnaire(form.questionnaire),
    status: form.status,
  };
}

export function workshopPresenterLabel(workshop: Workshop) {
  return workshop.presenter?.fullName || workshop.speakerInfo?.name || workshop.presenter?.email || '-';
}

export function isWorkshopPresenterCandidate(user: User) {
  if (!eligiblePresenterStatuses.has(user.status)) return false;

  const roleNames = user.roles
    .map((role) => (role.name || role.code)?.toUpperCase())
    .filter((roleName): roleName is string => Boolean(roleName));
  const hasPresenterRole = roleNames.some((roleName) => workshopPresenterRoles.has(roleName));
  const hasPresenterPermission = (user.permissions || []).some((permission) => workshopPresenterPermissions.has(permission));

  return hasPresenterRole || hasPresenterPermission;
}

export function workshopPresenterUserLabel(user: User) {
  return user.fullName || user.email;
}

export type { TimelineActivity };
