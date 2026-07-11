import type {
  CreateRoundRequest,
  Round,
  RoundStatus,
  RoundType,
  Team,
  UpdateRoundRequest,
  User,
} from '@/shared/api/types';
import { ApiError } from '@/shared/api/client';

export const roundTypeOptions: RoundType[] = ['PRELIMINARY', 'FINAL'];
export const roundStatusOptions: RoundStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'SCORING', 'COMPLETED'];

export interface RoundFormState {
  name: string;
  roundType: RoundType;
  problemStatement: string;
  examDriveUrl: string;
  trackId: string;
  rubricId: string;
  assignedTeamIds: string[];
  assignedJudgeIds: string[];
  startTime: string;
  endTime: string;
  submissionDeadline: string;
  publishTime: string;
  maxPromotedTeams: string;
  promotionRule: string;
  tieBreakRule: string;
  tieBreakDurationMinutes: string;
  status: RoundStatus;
}

export function createEmptyRoundForm(): RoundFormState {
  return {
    name: '',
    roundType: 'PRELIMINARY',
    problemStatement: '',
    examDriveUrl: '',
    trackId: 'none',
    rubricId: 'none',
    assignedTeamIds: [],
    assignedJudgeIds: [],
    startTime: '',
    endTime: '',
    submissionDeadline: '',
    publishTime: '',
    maxPromotedTeams: '',
    promotionRule: '',
    tieBreakRule: '',
    tieBreakDurationMinutes: '',
    status: 'DRAFT',
  };
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getCurrentDateTimeLocalInputValue() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toComparableDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateRoundSchedule(form: RoundFormState, options?: { allowPast?: boolean }) {
  const now = toComparableDate(getCurrentDateTimeLocalInputValue());
  const allowPast = options?.allowPast === true;
  const timeFields = [
    { key: 'startTime', label: 'Start time', value: form.startTime },
    { key: 'endTime', label: 'End time', value: form.endTime },
    { key: 'submissionDeadline', label: 'Submission deadline', value: form.submissionDeadline },
    { key: 'publishTime', label: 'Publish time', value: form.publishTime },
  ] as const;

  for (const field of timeFields) {
    if (!field.value) continue;
    const parsed = toComparableDate(field.value);
    if (!parsed) continue;
    if (!allowPast && now && parsed < now) {
      throw new ApiError({
        success: false,
        code: 'VALIDATION_ERROR',
        message: `${field.label} cannot be in the past`,
        errors: [`${field.label} cannot be in the past`],
      }, 400);
    }
  }

  const start = toComparableDate(form.startTime);
  const end = toComparableDate(form.endTime);
  if (start && end && end < start) {
    throw new ApiError({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'End time cannot be earlier than start time',
      errors: ['End time cannot be earlier than start time'],
    }, 400);
  }
}

export function formatDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toApiDateTimeValue(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function formatDateTimeDisplay(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function mapRoundToForm(round: Round): RoundFormState {
  return {
    name: round.name,
    roundType: round.roundType,
    problemStatement: round.problemStatement || '',
    examDriveUrl: round.examDriveUrl || '',
    trackId: round.trackId || 'none',
    rubricId: round.rubricId || 'none',
    assignedTeamIds: round.assignedTeamIds || [],
    assignedJudgeIds: round.assignedJudgeIds || [],
    startTime: formatDateTimeInput(round.startTime),
    endTime: formatDateTimeInput(round.endTime),
    submissionDeadline: formatDateTimeInput(round.submissionDeadline),
    publishTime: formatDateTimeInput(round.publishTime),
    maxPromotedTeams: round.maxPromotedTeams ? String(round.maxPromotedTeams) : '',
    promotionRule: round.promotionRule || '',
    tieBreakRule: round.tieBreakRule || '',
    tieBreakDurationMinutes: round.tieBreakDurationMinutes ? String(round.tieBreakDurationMinutes) : '',
    status: round.status,
  };
}

export function buildCreateRoundPayload(form: RoundFormState, eventId: string): CreateRoundRequest {
  validateRoundSchedule(form);

  return {
    eventId,
    name: form.name.trim(),
    roundType: form.roundType,
    problemStatement: normalizeText(form.problemStatement),
    examDriveUrl: normalizeText(form.examDriveUrl),
    trackId: form.trackId === 'none' ? null : form.trackId,
    assignedTeamIds: form.assignedTeamIds,
    assignedJudgeIds: form.assignedJudgeIds,
    rubricId: form.rubricId === 'none' ? null : form.rubricId,
    startTime: toApiDateTimeValue(form.startTime),
    endTime: toApiDateTimeValue(form.endTime),
    submissionDeadline: toApiDateTimeValue(form.submissionDeadline),
    publishTime: toApiDateTimeValue(form.publishTime),
    maxPromotedTeams: form.maxPromotedTeams ? Number(form.maxPromotedTeams) : null,
    promotionRule: normalizeText(form.promotionRule),
    tieBreakRule: normalizeText(form.tieBreakRule),
    tieBreakDurationMinutes: form.tieBreakDurationMinutes ? Number(form.tieBreakDurationMinutes) : null,
    status: form.status,
  };
}

export function buildUpdateRoundPayload(form: RoundFormState): UpdateRoundRequest {
  validateRoundSchedule(form, { allowPast: true });

  return {
    name: form.name.trim(),
    roundType: form.roundType,
    problemStatement: normalizeText(form.problemStatement),
    examDriveUrl: normalizeText(form.examDriveUrl),
    trackId: form.trackId === 'none' ? null : form.trackId,
    assignedTeamIds: form.assignedTeamIds,
    assignedJudgeIds: form.assignedJudgeIds,
    rubricId: form.rubricId === 'none' ? null : form.rubricId,
    startTime: toApiDateTimeValue(form.startTime),
    endTime: toApiDateTimeValue(form.endTime),
    submissionDeadline: toApiDateTimeValue(form.submissionDeadline),
    publishTime: toApiDateTimeValue(form.publishTime),
    maxPromotedTeams: form.maxPromotedTeams ? Number(form.maxPromotedTeams) : null,
    promotionRule: normalizeText(form.promotionRule),
    tieBreakRule: normalizeText(form.tieBreakRule),
    tieBreakDurationMinutes: form.tieBreakDurationMinutes ? Number(form.tieBreakDurationMinutes) : null,
    status: form.status,
  };
}

export function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

export function isJudgeUser(user: User) {
  const roleNames = user.roles
    .map((role) => (typeof role === 'string' ? role : role.code || role.name))
    .map((role) => role?.toUpperCase());
  return roleNames.includes('JUDGE') || roleNames.includes('ADMIN');
}

export function filterTeamsByTrack(teams: Team[], trackId: string) {
  if (trackId === 'none') return teams;
  return teams.filter((team) => team.trackId === trackId);
}

export function getRoundErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Please try again.';
}
