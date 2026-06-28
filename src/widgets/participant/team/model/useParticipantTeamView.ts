import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { teamsApi } from '@/entities/team/api';
import {
  createMemberRow,
  getApiErrorMessage,
  isRegistrationOpen,
  normalizeMemberRows,
  type MemberInviteRow,
} from '@/features/team/member-invites/model/helpers';
import type { TeamAvailability, TeamInvitation } from '@/shared/api/types';
import { useEventsQuery, useMyTeamQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

function getTeamAvailabilityMessage(availability?: TeamAvailability | null) {
  if (!availability || availability.available) return '';
  if (!availability.nameAvailable) return 'Team name already exists in this event.';
  if (!availability.leaderAvailable) return 'You already created a team for this event.';
  return availability.errors[0] || 'Team name or leader already exists in this event.';
}

export function useParticipantTeamView() {
  const queryClient = useQueryClient();
  const user = useStore((state) => state.user);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [invitedMembers, setInvitedMembers] = useState<MemberInviteRow[]>([createMemberRow()]);
  const [newInvitedMembers, setNewInvitedMembers] = useState<MemberInviteRow[]>([createMemberRow()]);
  const [replacementEmails, setReplacementEmails] = useState<Record<string, string>>({});
  const [createValidationPending, setCreateValidationPending] = useState(false);

  const eventsQuery = useEventsQuery();

  const events = eventsQuery.data || [];
  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events.find(isRegistrationOpen) || events[0];
  }, [events, selectedEventId]);

  const activeEventId = selectedEvent?.id || '';

  const teamQuery = useMyTeamQuery(activeEventId);
  const team = teamQuery.data;
  const registrationOpen = isRegistrationOpen(selectedEvent);
  const trimmedTeamName = teamName.trim();
  const debouncedTeamName = useDebouncedValue(trimmedTeamName, 350);

  const teamAvailabilityQuery = useQuery({
    queryKey: queryKeys.teams.availability(activeEventId, debouncedTeamName),
    enabled: Boolean(activeEventId && registrationOpen && !team && debouncedTeamName.length >= 2),
    queryFn: async () => {
      const response = await teamsApi.checkAvailability({
        eventId: activeEventId,
        name: debouncedTeamName,
      });
      return response.data;
    },
    staleTime: 5_000,
  });

  const isTeamNameCheckCurrent = debouncedTeamName === trimmedTeamName;
  const teamNameValidationMessage = useMemo(() => {
    if (!trimmedTeamName) return '';
    if (trimmedTeamName.length < 2) return 'Team name must be at least 2 characters.';
    if (team) return 'You already created a team for this event.';
    if (!isTeamNameCheckCurrent) return '';
    return getTeamAvailabilityMessage(teamAvailabilityQuery.data);
  }, [isTeamNameCheckCurrent, team, teamAvailabilityQuery.data, trimmedTeamName]);

  const teamNameChecking = Boolean(
    activeEventId &&
    registrationOpen &&
    !team &&
    trimmedTeamName.length >= 2 &&
    teamAvailabilityQuery.isFetching
  );

  const invalidateTeam = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.teams.my(activeEventId) });
  };

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      const members = normalizeMemberRows(invitedMembers, user?.email);
      const response = await teamsApi.create({
        eventId: activeEventId,
        name: teamName.trim(),
        projectName: projectName.trim(),
        invitedMembers: members,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Team created and invitations sent');
      setTeamName('');
      setProjectName('');
      setInvitedMembers([createMemberRow()]);
      await invalidateTeam();
    },
    onError: (error) => toast.error('Could not create team', { description: getApiErrorMessage(error) }),
  });

  const inviteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const members = normalizeMemberRows(newInvitedMembers, user?.email);
      if (members.length === 0) throw new Error('Enter at least one invited member.');
      const response = await teamsApi.inviteMembers(teamId, { members });
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Invitation emails queued');
      setNewInvitedMembers([createMemberRow()]);
      await invalidateTeam();
    },
    onError: (error) => toast.error('Could not send invitations', { description: getApiErrorMessage(error) }),
  });

  const replaceMutation = useMutation({
    mutationFn: async ({ teamId, invitation }: { teamId: string; invitation: TeamInvitation }) => {
      const email = replacementEmails[invitation.id]?.trim().toLowerCase();
      if (!email) throw new Error('Enter a replacement email.');
      const response = await teamsApi.replaceInvitation(teamId, invitation.id, { email });
      return response.data;
    },
    onSuccess: async (_, variables) => {
      toast.success('Replacement invitation sent');
      setReplacementEmails((current) => ({ ...current, [variables.invitation.id]: '' }));
      await invalidateTeam();
    },
    onError: (error) => toast.error('Could not replace invitation', { description: getApiErrorMessage(error) }),
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ teamId, invitationId }: { teamId: string; invitationId: string }) => {
      const response = await teamsApi.cancelInvitation(teamId, invitationId);
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Invitation cancelled');
      await invalidateTeam();
    },
    onError: (error) => toast.error('Could not cancel invitation', { description: getApiErrorMessage(error) }),
  });

  const isLeader = Boolean(team && user && team.leaderId === user.id);
  const canChangeInvitations = Boolean(isLeader && registrationOpen && team?.status !== 'REJECTED');

  async function handleCreateTeam() {
    if (!trimmedTeamName) {
      toast.error('Team name is required.');
      return;
    }

    if (trimmedTeamName.length < 2) {
      toast.error('Team name must be at least 2 characters.');
      return;
    }

    if (team) {
      toast.error('You already created a team for this event.');
      return;
    }

    if (!activeEventId) {
      toast.error('Please select an event first.');
      return;
    }

    setCreateValidationPending(true);
    try {
      const response = await teamsApi.checkAvailability({
        eventId: activeEventId,
        name: trimmedTeamName,
      });
      const availabilityMessage = getTeamAvailabilityMessage(response.data);
      if (availabilityMessage) {
        toast.error('Could not create team', { description: availabilityMessage });
        return;
      }
    } catch (error) {
      toast.error('Could not validate team', { description: getApiErrorMessage(error) });
      return;
    } finally {
      setCreateValidationPending(false);
    }

    createTeamMutation.mutate();
  }

  function handleInvite(teamId: string) {
    inviteMutation.mutate(teamId);
  }

  return {
    activeEventId,
    canChangeInvitations,
    cancelMutation,
    createValidationPending,
    createTeamMutation,
    events,
    eventsQuery,
    handleCreateTeam,
    handleInvite,
    inviteMutation,
    invitedMembers,
    newInvitedMembers,
    projectName,
    registrationOpen,
    replacementEmails,
    replaceMutation,
    selectedEvent,
    selectedEventId,
    setInvitedMembers,
    setNewInvitedMembers,
    setProjectName,
    setReplacementEmails,
    setSelectedEventId,
    setTeamName,
    team,
    teamNameChecking,
    teamNameValidationMessage,
    teamName,
    teamQuery,
  };
}
