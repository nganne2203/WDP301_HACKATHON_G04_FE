export const readOnlyCompetitionStatuses = new Set(['COMPLETED', 'ARCHIVED']);

export function isCompetitionReadOnly(competition?: { status?: string | null } | null) {
  return readOnlyCompetitionStatuses.has(String(competition?.status || '').toUpperCase());
}

export function getCompetitionReadOnlyMessage(resourceLabel: string) {
  return `${resourceLabel} is view-only after the competition has been completed or archived.`;
}
