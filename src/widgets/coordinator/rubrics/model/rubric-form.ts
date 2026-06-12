import { ApiError } from '@/shared/api/client';
import type {
  CreateCriterionRequest,
  CreateRubricRequest,
  Criterion,
  Rubric,
  RubricStatus,
  UpdateCriterionRequest,
  UpdateRubricRequest,
} from '@/shared/api/types';

export const rubricStatusOptions: RubricStatus[] = ['DRAFT', 'ACTIVE', 'ARCHIVED'];

export interface RubricFormState {
  title: string;
  description: string;
  roundId: string;
  version: string;
  status: RubricStatus;
}

export interface CriterionFormState {
  name: string;
  description: string;
  maxScore: string;
  weight: string;
  order: string;
  judgeOnly: boolean;
  aiSupportForAudit: boolean;
  aiInstruction: string;
}

export function createRubricForm(): RubricFormState {
  return {
    title: '',
    description: '',
    roundId: 'none',
    version: '1',
    status: 'DRAFT',
  };
}

export function createCriterionForm(): CriterionFormState {
  return {
    name: '',
    description: '',
    maxScore: '',
    weight: '1',
    order: '',
    judgeOnly: false,
    aiSupportForAudit: true,
    aiInstruction: '',
  };
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getRubricErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Please try again.';
}

export function mapRubricToForm(rubric: Rubric): RubricFormState {
  return {
    title: rubric.title,
    description: rubric.description || '',
    roundId: rubric.roundId || 'none',
    version: String(rubric.version || 1),
    status: rubric.status || 'DRAFT',
  };
}

export function mapCriterionToForm(criterion: Criterion): CriterionFormState {
  return {
    name: criterion.name,
    description: criterion.description || '',
    maxScore: String(criterion.maxScore),
    weight: String(criterion.weight),
    order: criterion.order ? String(criterion.order) : '',
    judgeOnly: Boolean(criterion.judgeOnly),
    aiSupportForAudit: criterion.aiSupportForAudit !== false,
    aiInstruction: criterion.aiInstruction || '',
  };
}

export function buildRubricPayload(form: RubricFormState, eventId: string): CreateRubricRequest {
  return {
    eventId,
    title: form.title.trim(),
    description: normalizeText(form.description),
    roundId: form.roundId === 'none' ? null : form.roundId,
    version: Number(form.version || 1),
    status: form.status,
  };
}

export function buildRubricUpdatePayload(form: RubricFormState): UpdateRubricRequest {
  return {
    title: form.title.trim(),
    description: normalizeText(form.description),
    version: Number(form.version || 1),
    status: form.status,
  };
}

export function buildCriterionPayload(form: CriterionFormState): CreateCriterionRequest {
  return {
    name: form.name.trim(),
    description: normalizeText(form.description),
    maxScore: Number(form.maxScore),
    weight: Number(form.weight || 1),
    order: form.order ? Number(form.order) : undefined,
    judgeOnly: form.judgeOnly,
    aiSupportForAudit: form.aiSupportForAudit,
    aiInstruction: normalizeText(form.aiInstruction),
  };
}

export function buildCriterionUpdatePayload(form: CriterionFormState): UpdateCriterionRequest {
  return buildCriterionPayload(form);
}
