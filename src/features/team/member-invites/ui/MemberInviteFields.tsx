import { useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { GitHubUserPicker } from '@/features/github/user-picker/ui/GitHubUserPicker';
import { queryKeys } from '@/lib/queryKeys';
import { teamsApi } from '@/shared/api/teams';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import {
  createMemberRow,
  removeMemberRow,
  type MemberInviteRow,
  updateMemberRow,
} from '@/features/team/member-invites/model/helpers';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_ELIGIBILITY_DEBOUNCE_MS = 900;

function getEmailEligibilityMessage(row: MemberInviteRow, duplicated: boolean) {
  const email = row.email.trim();
  if (!email) return '';
  if (!emailPattern.test(email)) return 'Enter a valid email address.';
  if (duplicated) return 'This email is duplicated in the invite list.';
  return row.emailInviteMessage || '';
}

function MemberInviteRowFields({
  activeEventId,
  disabled,
  duplicatedEmail,
  duplicatedGithubUsername,
  index,
  row,
  rows,
  setRows,
}: {
  activeEventId?: string;
  disabled?: boolean;
  duplicatedEmail: boolean;
  duplicatedGithubUsername: boolean;
  index: number;
  row: MemberInviteRow;
  rows: MemberInviteRow[];
  setRows: Dispatch<SetStateAction<MemberInviteRow[]>>;
}) {
  const normalizedEmail = row.email.trim().toLowerCase();
  const githubUsername = row.githubUsername.trim();
  const debouncedEmail = useDebouncedValue(normalizedEmail, INVITE_ELIGIBILITY_DEBOUNCE_MS);
  const emailFormatValid = !normalizedEmail || emailPattern.test(normalizedEmail);

  const eligibilityQuery = useQuery({
    queryKey: queryKeys.teams.inviteEligibility(activeEventId, debouncedEmail, githubUsername),
    enabled: Boolean(activeEventId && debouncedEmail && emailFormatValid && !duplicatedEmail && !disabled),
    queryFn: async () => (await teamsApi.checkInviteEligibility({
      eventId: activeEventId || '',
      email: debouncedEmail,
      githubUsername: githubUsername || undefined,
    })).data,
    retry: false,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (duplicatedGithubUsername) {
      updateMemberRow(setRows, row.id, 'githubUserValid', false);
    }
  }, [duplicatedGithubUsername, row.id, setRows]);

  useEffect(() => {
    if (!normalizedEmail) {
      updateMemberRow(setRows, row.id, 'emailInviteChecking', false);
      updateMemberRow(setRows, row.id, 'emailInviteValid', true);
      updateMemberRow(setRows, row.id, 'emailInviteMessage', '');
      return;
    }

    if (!emailFormatValid) {
      updateMemberRow(setRows, row.id, 'emailInviteChecking', false);
      updateMemberRow(setRows, row.id, 'emailInviteValid', false);
      updateMemberRow(setRows, row.id, 'emailInviteMessage', 'Enter a valid email address.');
      return;
    }

    if (duplicatedEmail) {
      updateMemberRow(setRows, row.id, 'emailInviteChecking', false);
      updateMemberRow(setRows, row.id, 'emailInviteValid', false);
      updateMemberRow(setRows, row.id, 'emailInviteMessage', 'This email is duplicated in the invite list.');
      return;
    }

    if (!activeEventId || debouncedEmail !== normalizedEmail) {
      updateMemberRow(setRows, row.id, 'emailInviteChecking', Boolean(activeEventId && normalizedEmail));
      updateMemberRow(setRows, row.id, 'emailInviteValid', true);
      updateMemberRow(setRows, row.id, 'emailInviteMessage', '');
      return;
    }

    if (eligibilityQuery.isFetching) {
      updateMemberRow(setRows, row.id, 'emailInviteChecking', true);
      updateMemberRow(setRows, row.id, 'emailInviteValid', true);
      updateMemberRow(setRows, row.id, 'emailInviteMessage', '');
      return;
    }

    if (eligibilityQuery.isError) {
      updateMemberRow(setRows, row.id, 'emailInviteChecking', false);
      updateMemberRow(setRows, row.id, 'emailInviteValid', false);
      updateMemberRow(setRows, row.id, 'emailInviteMessage', 'Could not check this email.');
      return;
    }

    if (eligibilityQuery.data) {
      updateMemberRow(setRows, row.id, 'emailInviteChecking', false);
      updateMemberRow(setRows, row.id, 'emailInviteValid', eligibilityQuery.data.available);
      updateMemberRow(setRows, row.id, 'emailInviteMessage', eligibilityQuery.data.errors[0] || '');
    }
  }, [
    activeEventId,
    debouncedEmail,
    duplicatedEmail,
    eligibilityQuery.data,
    eligibilityQuery.isError,
    eligibilityQuery.isFetching,
    emailFormatValid,
    githubUsername,
    normalizedEmail,
    row.id,
    setRows,
  ]);

  const emailMessage = getEmailEligibilityMessage(row, duplicatedEmail);
  const checkingEmail = Boolean(row.emailInviteChecking || eligibilityQuery.isFetching);
  const hasEmailError = Boolean(emailMessage);

  return (
    <div className="grid grid-cols-1 gap-2 items-start md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]">
      <div className="space-y-2">
        <Label htmlFor={`member-name-${row.id}`}>Name</Label>
        <Input
          id={`member-name-${row.id}`}
          value={row.fullName}
          onChange={(event) => updateMemberRow(setRows, row.id, 'fullName', event.target.value)}
          placeholder="Nguyen Van A"
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`member-email-${row.id}`}>Email</Label>
        <div className="relative">
          <Input
            id={`member-email-${row.id}`}
            type="email"
            value={row.email}
            onChange={(event) => {
              updateMemberRow(setRows, row.id, 'email', event.target.value);
              updateMemberRow(setRows, row.id, 'emailInviteChecking', Boolean(event.target.value.trim()));
              updateMemberRow(setRows, row.id, 'emailInviteValid', true);
              updateMemberRow(setRows, row.id, 'emailInviteMessage', '');
            }}
            placeholder="member@example.com"
            disabled={disabled}
            className={checkingEmail ? 'pr-9' : undefined}
            aria-invalid={hasEmailError}
          />
          {checkingEmail && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        {emailMessage && <p className="text-xs text-red-600">{emailMessage}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`member-github-${row.id}`}>GitHub username</Label>
        <GitHubUserPicker
          id={`member-github-${row.id}`}
          value={row.githubUsername}
          onChange={(value) => {
            updateMemberRow(setRows, row.id, 'githubUsername', value);
            updateMemberRow(setRows, row.id, 'githubUserValid', !value.trim());
          }}
          onValidityChange={(valid) => updateMemberRow(setRows, row.id, 'githubUserValid', valid && !duplicatedGithubUsername)}
          placeholder="octocat"
          disabled={disabled}
          checkAvailability={false}
        />
        {duplicatedGithubUsername && (
          <p className="text-xs text-red-600">This GitHub username is duplicated in the invite list.</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:mt-7"
        onClick={() => removeMemberRow(setRows, row.id)}
        disabled={disabled || rows.length === 1}
        aria-label="Remove invited member"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function MemberInviteFields({
  activeEventId,
  rows,
  setRows,
  disabled,
}: {
  activeEventId?: string;
  rows: MemberInviteRow[];
  setRows: Dispatch<SetStateAction<MemberInviteRow[]>>;
  disabled?: boolean;
}) {
  const duplicatedEmails = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const email = row.email.trim().toLowerCase();
      if (!email) return;
      counts.set(email, (counts.get(email) || 0) + 1);
    });
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([email]) => email));
  }, [rows]);

  const duplicatedGithubUsernames = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const username = row.githubUsername.trim().toLowerCase();
      if (!username) return;
      counts.set(username, (counts.get(username) || 0) + 1);
    });
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([username]) => username));
  }, [rows]);

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <MemberInviteRowFields
          key={row.id}
          activeEventId={activeEventId}
          disabled={disabled}
          duplicatedEmail={duplicatedEmails.has(row.email.trim().toLowerCase())}
          duplicatedGithubUsername={duplicatedGithubUsernames.has(row.githubUsername.trim().toLowerCase())}
          index={index}
          row={row}
          rows={rows}
          setRows={setRows}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((current) => [...current, createMemberRow()])}
        disabled={disabled}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add member
      </Button>
    </div>
  );
}
