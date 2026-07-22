import type {
  CreateRoundRequest,
  Competition,
  Round,
  RoundStatus,
  RoundType,
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

function getCompetitionDateInputValue(value?: string | null) {
  if (!value) return '';
  return value.split('T')[0] || '';
}

export function getCompetitionStartDateTimeInputValue(competition?: Competition | null) {
  const date = getCompetitionDateInputValue(competition?.startDate);
  return date ? `${date}T00:00` : '';
}

export function getCompetitionEndDateTimeInputValue(competition?: Competition | null) {
  const date = getCompetitionDateInputValue(competition?.endDate);
  return date ? `${date}T23:59` : '';
}

function maxDateTimeInput(...values: Array<string | undefined>) {
  return values.filter(Boolean).sort().at(-1) || undefined;
}

function minDateTimeInput(...values: Array<string | undefined>) {
  return values.filter(Boolean).sort()[0] || undefined;
}

function validateRoundSchedule(form: RoundFormState, options?: { allowPast?: boolean; competition?: Competition | null }) {
  const now = toComparableDate(getCurrentDateTimeLocalInputValue());
  const allowPast = options?.allowPast === true;
  const eventStartDate = getCompetitionDateInputValue(options?.competition?.startDate);
  const eventEndDate = getCompetitionDateInputValue(options?.competition?.endDate);
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

  const eventWindowFields = [
    { label: 'Start time', value: form.startTime },
    { label: 'End time', value: form.endTime },
    { label: 'Submission deadline', value: form.submissionDeadline },
    { label: 'Publish time', value: form.publishTime },
  ];

  for (const field of eventWindowFields) {
    if (!field.value) continue;
    const datePart = field.value.split('T')[0];
    if (eventStartDate && datePart < eventStartDate) {
      throw new ApiError({
        success: false,
        code: 'VALIDATION_ERROR',
        message: `${field.label} must be within the competition date range`,
        errors: [`${field.label} must be within the competition date range`],
      }, 400);
    }

    if (eventEndDate && datePart > eventEndDate) {
      throw new ApiError({
        success: false,
        code: 'VALIDATION_ERROR',
        message: `${field.label} must be within the competition date range`,
        errors: [`${field.label} must be within the competition date range`],
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

  const submissionDeadline = toComparableDate(form.submissionDeadline);
  if (start && submissionDeadline && submissionDeadline < start) {
    throw new ApiError({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Submission deadline must be after or equal to start time',
      errors: ['Submission deadline must be after or equal to start time'],
    }, 400);
  }

  if (submissionDeadline && end && submissionDeadline > end) {
    throw new ApiError({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Submission deadline must be before or equal to end time',
      errors: ['Submission deadline must be before or equal to end time'],
    }, 400);
  }

  const publishTime = toComparableDate(form.publishTime);
  if (publishTime && end && publishTime < end) {
    throw new ApiError({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Publish time must be after or equal to end time',
      errors: ['Publish time must be after or equal to end time'],
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

export function buildCreateRoundPayload(form: RoundFormState, competition: Competition): CreateRoundRequest {
  validateRoundSchedule(form, { competition });

  return {
    competitionId: competition.id,
    name: form.name.trim(),
    roundType: form.roundType,
    problemStatement: normalizeText(form.problemStatement),
    examDriveUrl: normalizeText(form.examDriveUrl),
    trackId: form.trackId === 'none' ? null : form.trackId,
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

export function buildUpdateRoundPayload(form: RoundFormState, competition?: Competition | null): UpdateRoundRequest {
  validateRoundSchedule(form, { allowPast: true, competition });

  return {
    name: form.name.trim(),
    roundType: form.roundType,
    problemStatement: normalizeText(form.problemStatement),
    examDriveUrl: normalizeText(form.examDriveUrl),
    trackId: form.trackId === 'none' ? null : form.trackId,
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

export function getRoundStartMin(competition?: Competition | null) {
  return maxDateTimeInput(getCurrentDateTimeLocalInputValue(), getCompetitionStartDateTimeInputValue(competition));
}

export function getRoundEndMin(form: RoundFormState, competition?: Competition | null) {
  return maxDateTimeInput(form.startTime || getCurrentDateTimeLocalInputValue(), getCompetitionStartDateTimeInputValue(competition));
}

export function getRoundDateTimeMax(competition?: Competition | null) {
  return minDateTimeInput(getCompetitionEndDateTimeInputValue(competition));
}

export function getSubmissionDeadlineMin(form: RoundFormState, competition?: Competition | null) {
  return maxDateTimeInput(
    getCurrentDateTimeLocalInputValue(),
    getCompetitionStartDateTimeInputValue(competition),
    form.startTime
  );
}

export function getSubmissionDeadlineMax(form: RoundFormState, competition?: Competition | null) {
  return minDateTimeInput(form.endTime || undefined, getCompetitionEndDateTimeInputValue(competition));
}

export function getPublishTimeMin(form: RoundFormState, competition?: Competition | null) {
  return maxDateTimeInput(
    getCurrentDateTimeLocalInputValue(),
    getCompetitionStartDateTimeInputValue(competition),
    form.endTime
  );
}

export function isJudgeUser(user: User) {
  const roleNames = user.roles
    .map((role) => (typeof role === 'string' ? role : role.code || role.name))
    .map((role) => role?.toUpperCase());
  return roleNames.includes('JUDGE');
}

export function getRoundErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Please try again.';
}
