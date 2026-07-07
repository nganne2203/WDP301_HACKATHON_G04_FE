import type { Dispatch, SetStateAction } from 'react';
import type { Team, TeamInvitation, TeamInviteMember } from '@/shared/api/types';
import { ApiError } from '@/shared/api/client';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
export type MemberInviteRow = TeamInviteMember & { id: string; githubUserValid?: boolean };

export function createMemberRow(): MemberInviteRow {
  return {
    id: Math.random().toString(36).slice(2),
    fullName: '',
    email: '',
    githubUsername: '',
    githubUserValid: true,
  };
}

export function normalizeMemberRows(rows: MemberInviteRow[], leaderEmail?: string) {
  const members = rows
    .map((row) => ({
      fullName: row.fullName.trim(),
      email: row.email.trim().toLowerCase(),
      githubUsername: row.githubUsername.trim()
    }))
    .filter((row) => row.fullName || row.email || row.githubUsername);

  const invalidRow = members.find((member) => !member.fullName || !member.email || !member.githubUsername);
  if (invalidRow) {
    throw new Error('Each invited member must include name, email, and GitHub username.');
  }

  const invalidGithubRow = rows.find((row) => row.githubUsername.trim() && row.githubUserValid === false);
  if (invalidGithubRow) {
    throw new Error('Select a valid GitHub account for each invited member.');
  }

  const normalizedLeaderEmail = leaderEmail?.trim().toLowerCase();
  if (normalizedLeaderEmail && members.some((member) => member.email === normalizedLeaderEmail)) {
    throw new Error('You cannot invite your own email as a team member.');
  }

  const seenEmails = new Set<string>();
  return members.filter((member) => {
    if (seenEmails.has(member.email)) return false;
    seenEmails.add(member.email);
    return true;
  });
}

export function isRegistrationOpen(event?: { status: string; registrationStart?: string | null; registrationEnd?: string | null } | null) {
  if (!event || event.status !== 'OPEN_REGISTRATION') return false;
  const now = new Date();
  if (event.registrationStart && now < new Date(event.registrationStart)) return false;
  if (event.registrationEnd && now > new Date(event.registrationEnd)) return false;
  return true;
}

export function getInitials(nameOrEmail?: string) {
  return (nameOrEmail || '?')
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof Error && !(error instanceof ApiError)) return error.message;
  return error instanceof ApiError ? error.firstError : 'Could not connect to server.';
}

export function statusBadgeVariant(status: string): BadgeVariant {
  if (status === 'CONFIRMED' || status === 'JOINED' || status === 'ACTIVE' || status === 'ACCEPTED') return 'default';
  if (status === 'REJECTED' || status === 'DECLINED' || status === 'CANCELLED') return 'destructive';
  return 'secondary';
}

export function updateMemberRow(
  setRows: Dispatch<SetStateAction<MemberInviteRow[]>>,
  id: string,
  field: 'fullName' | 'email' | 'githubUsername' | 'githubUserValid',
  value: string | boolean
) {
  setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
}

export function removeMemberRow(
  setRows: Dispatch<SetStateAction<MemberInviteRow[]>>,
  id: string
) {
  setRows((current) => {
    if (current.length === 1) return current;
    return current.filter((row) => row.id !== id);
  });
}

export function canManageInvitation(team: Team | null | undefined, invitation: TeamInvitation, isLeader: boolean, registrationOpen: boolean) {
  return isLeader && registrationOpen && team?.status !== 'REJECTED' && invitation.status === 'PENDING';
}
