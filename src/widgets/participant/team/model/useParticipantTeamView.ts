import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { useStore } from '@/entities/session/model/store';
import { teamsApi } from '@/entities/team/api';
import {
  createMemberRow,
  getApiErrorMessage,
  isRegistrationOpen,
  normalizeMemberRows,
  type MemberInviteRow,
} from '@/features/team/member-invites/model/helpers';
import { ApiError } from '@/shared/api/client';
import type { TeamInvitation } from '@/shared/api/types';

export function useParticipantTeamView() {
  const queryClient = useQueryClient();
  const { user } = useStore();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [invitedMembers, setInvitedMembers] = useState<MemberInviteRow[]>([createMemberRow()]);
  const [newInvitedMembers, setNewInvitedMembers] = useState<MemberInviteRow[]>([createMemberRow()]);
  const [replacementEmails, setReplacementEmails] = useState<Record<string, string>>({});

  const eventsQuery = useQuery({
    queryKey: ['participant-team-events'],
    queryFn: async () => {
      const response = await eventsApi.list({ page: 1, limit: 100 });
      return response.data;
    },
  });

  const events = eventsQuery.data || [];
  const selectedEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events.find(isRegistrationOpen) || events[0];
  }, [events, selectedEventId]);

  const activeEventId = selectedEvent?.id || '';

  const teamQuery = useQuery({
    queryKey: ['my-team', activeEventId],
    enabled: Boolean(activeEventId),
    retry: false,
    queryFn: async () => {
      try {
        const response = await teamsApi.getMyTeam(activeEventId);
        return response.data;
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) return null;
        throw error;
      }
    },
  });

  const invalidateTeam = async () => {
    await queryClient.invalidateQueries({ queryKey: ['my-team', activeEventId] });
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

  const team = teamQuery.data;
  const registrationOpen = isRegistrationOpen(selectedEvent);
  const isLeader = Boolean(team && user && team.leaderId === user.id);
  const canChangeInvitations = Boolean(isLeader && registrationOpen && team?.status !== 'REJECTED');

  function handleCreateTeam() {
    if (!teamName.trim()) {
      toast.error('Team name is required.');
      return;
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
    teamName,
    teamQuery,
  };
}
