import { z } from 'zod';
import type { CreateCompetitionRequest, Competition, CompetitionStatus, FinalistSelectionMode } from '@/shared/api/types';

export const competitionStatusOptions: { value: CompetitionStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN_REGISTRATION', label: 'Open Registration' },
  { value: 'REGISTRATION_CLOSED', label: 'Registration Closed' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'SCORING', label: 'Scoring' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const eventLifecycleTransitions: Partial<Record<CompetitionStatus, CompetitionStatus>> = {
  DRAFT: 'OPEN_REGISTRATION',
  OPEN_REGISTRATION: 'REGISTRATION_CLOSED',
  REGISTRATION_CLOSED: 'ONGOING',
  ONGOING: 'SCORING',
  SCORING: 'COMPLETED',
  COMPLETED: 'ARCHIVED',
};

export const eventLifecycleActionLabels: Record<CompetitionStatus, string> = {
  DRAFT: 'Open registration',
  OPEN_REGISTRATION: 'Close registration',
  REGISTRATION_CLOSED: 'Start competition',
  ONGOING: 'Start scoring',
  SCORING: 'Complete competition',
  COMPLETED: 'Archive competition',
  ARCHIVED: 'Archived',
};

export const finalistSelectionModeOptions: { value: FinalistSelectionMode; label: string; description: string }[] = [
  {
    value: 'FIXED_PER_BOARD',
    label: 'Fixed per board',
    description: 'Take the top N teams from each judging board.',
  },
  {
    value: 'TOP_PER_BOARD_WITH_WILDCARD',
    label: 'Board winners + wildcard',
    description: 'Take top teams per board, then fill remaining slots by overall score.',
  },
  {
    value: 'OVERALL_SCORE',
    label: 'Overall score',
    description: 'Ignore board quotas and take the highest ranked teams overall.',
  },
  {
    value: 'CUSTOM',
    label: 'Custom review',
    description: 'Prepare for manual coordinator review after ranking.',
  },
];

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().positive().optional());

export const eventFormSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  semester: z.string().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  boardCount: optionalNumber,
  maxTeamsPerBoard: optionalNumber,
  finalistsPerBoard: optionalNumber,
  finalistCount: optionalNumber,
  finalistSelectionMode: z.enum(['FIXED_PER_BOARD', 'TOP_PER_BOARD_WITH_WILDCARD', 'OVERALL_SCORE', 'CUSTOM']).optional(),
  fillRemainingFinalistsByOverallScore: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date cannot be earlier than start date',
      });
    }
  }

  if (data.finalistSelectionMode === 'FIXED_PER_BOARD' && data.boardCount && data.finalistsPerBoard && data.finalistCount) {
    const expectedFinalists = data.boardCount * data.finalistsPerBoard;

    if (data.finalistCount !== expectedFinalists) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['finalistCount'],
        message: `For fixed per board mode, total finalists must be ${expectedFinalists}.`,
      });
    }
  }

  if (data.finalistsPerBoard && data.finalistCount && data.finalistsPerBoard > data.finalistCount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['finalistsPerBoard'],
      message: 'Finalists per board cannot exceed total finalists.',
    });
  }
});

export type CompetitionFormValues = z.infer<typeof eventFormSchema>;

export function toCreateCompetitionRequest(data: CompetitionFormValues): CreateCompetitionRequest {
  const competitionConfig = buildCompetitionConfig(data);

  return {
    title: data.title,
    description: data.description || undefined,
    semester: data.semester || undefined,
    startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    finalistSlotsPerTrack: data.finalistsPerBoard,
    totalFinalistSlots: data.finalistCount,
    competitionConfig,
  };
}

export function toUpdateCompetitionRequest(data: CompetitionFormValues): Partial<CreateCompetitionRequest> {
  const competitionConfig = buildCompetitionConfig(data);

  return {
    title: data.title,
    description: data.description || undefined,
    semester: data.semester || undefined,
    startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    finalistSlotsPerTrack: data.finalistsPerBoard,
    totalFinalistSlots: data.finalistCount,
    competitionConfig,
  };
}

export function toEditCompetitionFormValues(competition: Competition): CompetitionFormValues {
  return {
    title: competition.title,
    description: competition.description || '',
    semester: competition.semester || '',
    startDate: competition.startDate ? competition.startDate.split('T')[0] : '',
    endDate: competition.endDate ? competition.endDate.split('T')[0] : '',
    boardCount: competition.competitionConfig?.boardCount,
    maxTeamsPerBoard: competition.competitionConfig?.maxTeamsPerBoard,
    finalistsPerBoard: competition.competitionConfig?.finalistsPerBoard ?? competition.finalistSlotsPerTrack,
    finalistCount: competition.competitionConfig?.finalistCount ?? competition.totalFinalistSlots,
    finalistSelectionMode: competition.competitionConfig?.finalistSelectionMode ?? 'FIXED_PER_BOARD',
    fillRemainingFinalistsByOverallScore: competition.competitionConfig?.fillRemainingFinalistsByOverallScore ?? false,
  };
}

function buildCompetitionConfig(data: CompetitionFormValues): CreateCompetitionRequest['competitionConfig'] | undefined {
  const hasConfig = Boolean(
    data.boardCount
    || data.maxTeamsPerBoard
    || data.finalistsPerBoard
    || data.finalistCount
    || data.finalistSelectionMode
    || data.fillRemainingFinalistsByOverallScore
  );

  if (!hasConfig) return undefined;

  return {
    boardCount: data.boardCount,
    maxTeamsPerBoard: data.maxTeamsPerBoard,
    finalistsPerBoard: data.finalistsPerBoard,
    finalistCount: data.finalistCount,
    finalistSelectionMode: data.finalistSelectionMode || 'FIXED_PER_BOARD',
    fillRemainingFinalistsByOverallScore: data.fillRemainingFinalistsByOverallScore || false,
  };
}

export function describeAdvancementRule(competition?: Competition | null) {
  if (!competition) return 'No competition selected.';

  const config = competition.competitionConfig;
  const mode = config?.finalistSelectionMode || 'FIXED_PER_BOARD';
  const boardCount = config?.boardCount;
  const finalistsPerBoard = config?.finalistsPerBoard ?? competition.finalistSlotsPerTrack;
  const finalistCount = config?.finalistCount ?? competition.totalFinalistSlots;

  if (mode === 'FIXED_PER_BOARD' && boardCount && finalistsPerBoard) {
    return `${boardCount} board(s), top ${finalistsPerBoard} team(s) per board advance (${finalistCount || boardCount * finalistsPerBoard} total).`;
  }

  if (mode === 'TOP_PER_BOARD_WITH_WILDCARD' && finalistsPerBoard && finalistCount) {
    return `Top ${finalistsPerBoard} team(s) per board advance first, then wildcard slots fill up to ${finalistCount} total by overall score.`;
  }

  if (mode === 'OVERALL_SCORE' && finalistCount) {
    return `Top ${finalistCount} team(s) by overall score advance, regardless of board.`;
  }

  if (mode === 'CUSTOM') {
    return 'Custom review mode: rankings are generated first, then organizers review finalist selection.';
  }

  return 'Advancement rule has not been fully configured yet.';
}

export function parseInviteEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export function formatCompetitionDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export function mapCompetitionStatus(status: CompetitionStatus) {
  return status.toLowerCase();
}

export function getNextCompetitionStatus(status: CompetitionStatus) {
  return eventLifecycleTransitions[status] || null;
}

export function getCompetitionLifecycleActionLabel(status: CompetitionStatus) {
  return eventLifecycleActionLabels[status];
}

export function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
