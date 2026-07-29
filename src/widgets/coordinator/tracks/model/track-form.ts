import { ApiError } from '@/shared/api/client';
import type { CreateTrackRequest, Track, TrackStatus, TrackType, UpdateTrackRequest } from '@/shared/api/types';

export const trackTypeOptions: TrackType[] = ['PRELIMINARY_GROUP', 'FINAL_POOL', 'GENERAL'];
export const trackStatusOptions: TrackStatus[] = ['DRAFT', 'OPEN', 'LOCKED', 'COMPLETED'];

export interface TrackFormState {
  code: string;
  name: string;
  description: string;
  topic: string;
  problemStatement: string;
  type: TrackType;
  maxTeams: string;
  status: TrackStatus;
}

export function createEmptyTrackForm(): TrackFormState {
  return {
    code: '',
    name: '',
    description: '',
    topic: '',
    problemStatement: '',
    type: 'PRELIMINARY_GROUP',
    maxTeams: '',
    status: 'DRAFT',
  };
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getMaxTeams(form: TrackFormState) {
  const maxTeams = Number(form.maxTeams);
  if (!Number.isInteger(maxTeams) || maxTeams < 2) {
    throw new ApiError({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Max teams must be at least 2',
      errors: ['A track needs capacity for at least 2 teams.'],
    }, 400);
  }
  return maxTeams;
}

export function buildTrackPayload(form: TrackFormState, competitionId: string): CreateTrackRequest {
  return {
    competitionId,
    code: normalizeOptionalText(form.code)?.toUpperCase() || undefined,
    name: form.name.trim(),
    description: normalizeOptionalText(form.description),
    topic: normalizeOptionalText(form.topic),
    problemStatement: normalizeOptionalText(form.problemStatement),
    type: form.type,
    maxTeams: getMaxTeams(form),
    status: form.status,
  };
}

export function buildTrackUpdatePayload(form: TrackFormState): UpdateTrackRequest {
  return {
    code: normalizeOptionalText(form.code)?.toUpperCase() || null || undefined,
    name: form.name.trim(),
    description: normalizeOptionalText(form.description),
    topic: normalizeOptionalText(form.topic),
    problemStatement: normalizeOptionalText(form.problemStatement),
    type: form.type,
    maxTeams: getMaxTeams(form),
    status: form.status,
  };
}

export function mapTrackToForm(track: Track): TrackFormState {
  return {
    code: track.code || '',
    name: track.name,
    description: track.description || '',
    topic: track.topic || '',
    problemStatement: track.problemStatement || '',
    type: track.type || 'PRELIMINARY_GROUP',
    maxTeams: track.maxTeams ? String(track.maxTeams) : '',
    status: track.status || 'DRAFT',
  };
}

export function formatTrackType(type?: TrackType) {
  return (type || 'GENERAL').replaceAll('_', ' ');
}
