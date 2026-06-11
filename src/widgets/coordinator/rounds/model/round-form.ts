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

export function formatDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function formatDateTimeDisplay(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export function mapRoundToForm(round: Round): RoundFormState {
  return {
    name: round.name,
    roundType: round.roundType,
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
  return {
    eventId,
    name: form.name.trim(),
    roundType: form.roundType,
    trackId: form.trackId === 'none' ? null : form.trackId,
    assignedTeamIds: form.assignedTeamIds,
    assignedJudgeIds: form.assignedJudgeIds,
    rubricId: form.rubricId === 'none' ? null : form.rubricId,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    submissionDeadline: form.submissionDeadline || null,
    publishTime: form.publishTime || null,
    maxPromotedTeams: form.maxPromotedTeams ? Number(form.maxPromotedTeams) : null,
    promotionRule: normalizeText(form.promotionRule),
    tieBreakRule: normalizeText(form.tieBreakRule),
    tieBreakDurationMinutes: form.tieBreakDurationMinutes ? Number(form.tieBreakDurationMinutes) : null,
    status: form.status,
  };
}

export function buildUpdateRoundPayload(form: RoundFormState): UpdateRoundRequest {
  return {
    name: form.name.trim(),
    roundType: form.roundType,
    trackId: form.trackId === 'none' ? null : form.trackId,
    assignedTeamIds: form.assignedTeamIds,
    assignedJudgeIds: form.assignedJudgeIds,
    rubricId: form.rubricId === 'none' ? null : form.rubricId,
    startTime: form.startTime || null,
    endTime: form.endTime || null,
    submissionDeadline: form.submissionDeadline || null,
    publishTime: form.publishTime || null,
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
  const roleNames = user.roles.map((role) => role.name?.toUpperCase());
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
