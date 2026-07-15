import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Layers3, Loader2, UserRound, UsersRound } from 'lucide-react';

import { TeamDetail, teamsApi } from '@/entities/team';
import { useStore } from '@/entities/session/model/store';
import { usersApi } from '@/entities/user/api';
import { useEventsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import type { Team, User } from '@/shared/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { ListPagination } from '@/shared/ui/list-pagination';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

function getMentorLabel(mentor: Pick<User, 'fullName' | 'email'>) {
  return mentor.fullName || mentor.email;
}

export function MentorAssignmentsView() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedBoardNumber, setSelectedBoardNumber] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);

  const eventsQuery = useEventsQuery({ page: 1, limit: 100 });
  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEvent?.id) || events[0];
  }, [events, selectedEvent?.id]);

  useEffect(() => {
    setSelectedBoardNumber('all');
    setPage(1);
    setEditingTeam(null);
    setSelectedMentorIds([]);
  }, [activeEvent?.id]);

  const boardTeamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ eventId: activeEvent?.id, status: 'CONFIRMED', limit: 100 }),
    enabled: Boolean(activeEvent?.id),
    queryFn: () => teamsApi.list({ eventId: activeEvent?.id, status: 'CONFIRMED', limit: 100 }),
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.list({
      eventId: activeEvent?.id,
      status: 'CONFIRMED',
      boardNumber: selectedBoardNumber === 'all' ? undefined : Number(selectedBoardNumber),
      page,
      limit: 12,
    }),
    enabled: Boolean(activeEvent?.id),
    queryFn: () => teamsApi.list({
      eventId: activeEvent?.id,
      status: 'CONFIRMED',
      boardNumber: selectedBoardNumber === 'all' ? undefined : Number(selectedBoardNumber),
      page,
      limit: 12,
    }),
  });

  const mentorsQuery = useQuery({
    queryKey: queryKeys.users.list({ page: 1, limit: 100, roles: ['MENTOR'] }),
    queryFn: () => usersApi.list({ page: 1, limit: 100, roles: ['MENTOR'] }),
  });

  const updateMentorsMutation = useMutation({
    mutationFn: ({ teamId, mentorIds }: { teamId: string; mentorIds: string[] }) =>
      teamsApi.updateMentors(teamId, { mentorIds }),
    onSuccess: (response) => {
      const updatedTeam = response.data;
      toast.success('Mentor assignments saved', { description: updatedTeam.name });
      setEditingTeam(null);
      setSelectedMentorIds([]);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
      ]);
    },
    onError: (error) => {
      toast.error('Could not update mentor assignments', { description: getErrorMessage(error) });
    },
  });

  const assignBoardMentorsMutation = useMutation({
    mutationFn: ({ eventId, boardNumber, mentorIds }: { eventId: string; boardNumber: number; mentorIds: string[] }) =>
      teamsApi.assignMentorsByBoard({ eventId, boardNumber, mentorIds }),
    onSuccess: (response) => {
      toast.success('Board mentor assignment saved', {
        description: `${response.data.updatedCount} team(s) updated in board ${response.data.boardNumber}.`,
      });
      setBulkAssignOpen(false);
      setSelectedMentorIds([]);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
      ]);
    },
    onError: (error) => {
      toast.error('Could not assign mentors to board', { description: getErrorMessage(error) });
    },
  });

  const teams = teamsQuery.data?.data || [];
  const pagination = teamsQuery.data?.pagination;
  const mentors = (mentorsQuery.data?.data || []).filter((mentor) => (
    mentor.status === 'ACTIVE'
  ));
  const allEventTeams = boardTeamsQuery.data?.data || [];
  const boardOptions = useMemo(() => {
    const grouped = new Map<number, number>();
    allEventTeams.forEach((team) => {
      if (!team.boardNumber) return;
      grouped.set(team.boardNumber, (grouped.get(team.boardNumber) || 0) + 1);
    });

    return [...grouped.entries()]
      .sort((left, right) => left[0] - right[0])
      .map(([boardNumber, teamCount]) => ({ boardNumber, teamCount }));
  }, [allEventTeams]);
  const activeBoardNumber = selectedBoardNumber === 'all' ? null : Number(selectedBoardNumber);
  const teamsInSelectedBoard = useMemo(() => {
    if (!activeBoardNumber) return [];
    return allEventTeams.filter((team) => team.boardNumber === activeBoardNumber);
  }, [activeBoardNumber, allEventTeams]);

  function openAssignmentDialog(team: Team) {
    setEditingTeam(team);
    setSelectedMentorIds(team.mentorIds || []);
  }

  function openBulkAssignDialog() {
    if (!activeBoardNumber || teamsInSelectedBoard.length === 0) return;
    const commonMentorIds = teamsInSelectedBoard[0]?.mentorIds || [];
    const identicalMentorSets = teamsInSelectedBoard.every((team) => {
      const teamMentorIds = team.mentorIds || [];
      return teamMentorIds.length === commonMentorIds.length &&
        teamMentorIds.every((mentorId) => commonMentorIds.includes(mentorId));
    });

    setSelectedMentorIds(identicalMentorSets ? commonMentorIds : []);
    setBulkAssignOpen(true);
  }

  function toggleMentor(mentorId: string, checked: boolean) {
    setSelectedMentorIds((current) => (
      checked ? [...new Set([...current, mentorId])] : current.filter((id) => id !== mentorId)
    ));
  }

  async function saveAssignments() {
    if (!editingTeam) return;
    await updateMentorsMutation.mutateAsync({
      teamId: editingTeam.id,
      mentorIds: selectedMentorIds,
    });
  }

  async function saveBoardAssignments() {
    if (!activeEvent?.id || !activeBoardNumber) return;
    await assignBoardMentorsMutation.mutateAsync({
      eventId: activeEvent.id,
      boardNumber: activeBoardNumber,
      mentorIds: selectedMentorIds,
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold mb-1">Mentor Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Assign active mentors to confirmed teams.
          </p>
        </div>
        <div className="grid w-full gap-3 xl:w-auto xl:grid-cols-[minmax(180px,240px)_auto]">
          <Select
            value={selectedBoardNumber}
            onValueChange={(value) => {
              setSelectedBoardNumber(value);
              setPage(1);
            }}
            disabled={!activeEvent?.id || boardTeamsQuery.isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="All boards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All boards</SelectItem>
              {boardOptions.map((board) => (
                <SelectItem key={board.boardNumber} value={String(board.boardNumber)}>
                  {`Board ${board.boardNumber} (${board.teamCount} teams)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full xl:w-auto"
            onClick={openBulkAssignDialog}
            disabled={!activeBoardNumber || teamsInSelectedBoard.length === 0}
          >
            <Layers3 className="mr-2 h-4 w-4" />
            Assign Board Mentors
          </Button>
        </div>
      </div>

      {(teamsQuery.isLoading || mentorsQuery.isLoading || boardTeamsQuery.isLoading) && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading mentor assignment data</AlertTitle>
          <AlertDescription>Loading confirmed teams and active mentors.</AlertDescription>
        </Alert>
      )}

      {!mentorsQuery.isLoading && mentors.length === 0 && (
        <Alert>
          <UserRound className="h-4 w-4" />
          <AlertTitle>No active mentors found</AlertTitle>
          <AlertDescription>Activate a mentor account before assigning mentors to teams.</AlertDescription>
        </Alert>
      )}

      {!teamsQuery.isLoading && teams.length === 0 && activeEvent?.id && (
        <Alert>
          <UsersRound className="h-4 w-4" />
          <AlertTitle>No confirmed teams in this event</AlertTitle>
          <AlertDescription>Teams appear here only after their registration is confirmed.</AlertDescription>
        </Alert>
      )}

      {activeBoardNumber && (
        <Alert>
          <Layers3 className="h-4 w-4" />
          <AlertTitle>{`Board ${activeBoardNumber} selected`}</AlertTitle>
          <AlertDescription>
            {teamsInSelectedBoard.length > 0
              ? `${teamsInSelectedBoard.length} team(s) are in this board. You can assign mentors to the entire board in one action.`
              : 'No confirmed teams were found in this board for the selected event.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {teams.map((team) => (
          <Sheet key={team.id}>
            <Card className="h-full">
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="break-words">{team.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground break-words">{team.event?.title}</p>
                  </div>
                  <Badge className="w-fit shrink-0 self-start" variant="outline">
                    {team.assignedMentors?.length || 0} mentor(s)
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(team.assignedMentors || []).length > 0 ? (
                    team.assignedMentors!.map((mentor) => (
                      <Badge key={mentor.id} variant="secondary">
                        {mentor.fullName || mentor.email}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No mentors assigned yet.</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <SheetTrigger asChild>
                  <Button className="w-full sm:w-auto" variant="outline">View team details</Button>
                </SheetTrigger>
                <Button className="w-full sm:w-auto" onClick={() => openAssignmentDialog(team)}>Assign mentors</Button>
              </CardContent>
            </Card>
            <SheetContent className="w-full overflow-y-auto px-6 sm:max-w-xl">
              <SheetHeader className="pr-8">
                <SheetTitle>{team.name}</SheetTitle>
                <SheetDescription>Review members, invitations, and mentors responsible for this team.</SheetDescription>
              </SheetHeader>
              <TeamDetail team={team} />
            </SheetContent>
          </Sheet>
        ))}
      </div>

      <ListPagination page={page} pagination={pagination} onPageChange={setPage} />

      <Dialog open={Boolean(editingTeam)} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="flex max-h-[92vh] w-full flex-col overflow-hidden p-0 sm:max-w-[min(95vw,820px)]">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Assign Mentors</DialogTitle>
            <DialogDescription>
              {editingTeam
                ? `Choose approved mentors responsible for ${editingTeam.name}. The team will keep one shared chat room.`
                : 'Choose approved mentors for this team.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium">Selected mentors</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMentorIds.length > 0
                      ? mentors
                        .filter((mentor) => selectedMentorIds.includes(mentor.id))
                        .map((mentor) => (
                          <Badge key={mentor.id} variant="secondary">
                            {getMentorLabel(mentor)}
                          </Badge>
                        ))
                      : <span className="text-sm text-muted-foreground">No mentors selected.</span>}
                  </div>
                </div>
                {editingTeam && (
                  <div className="rounded-lg border p-4">
                    <p className="text-sm font-medium">Team context</p>
                    <p className="mt-2 text-sm text-muted-foreground">{editingTeam.event?.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {editingTeam.participants.length} participant(s), {editingTeam.invitations.length} invitation(s)
                    </p>
                  </div>
                )}
              </div>

              <div className="min-h-0 rounded-lg border">
                <ScrollArea className="h-[260px] sm:h-[320px] lg:h-[360px]">
                  <div className="space-y-3 p-4">
                    {mentors.length > 0 ? mentors.map((mentor) => {
                      const checked = selectedMentorIds.includes(mentor.id);
                      return (
                        <label key={mentor.id} className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => toggleMentor(mentor.id, Boolean(value))}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium break-words">{mentor.fullName || mentor.email}</p>
                            <p className="text-xs text-muted-foreground break-all">{mentor.email}</p>
                          </div>
                        </label>
                      );
                    }) : (
                      <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                        No active mentor accounts available.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-background px-6 py-4">
            <Button variant="outline" onClick={() => setEditingTeam(null)} disabled={updateMentorsMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={saveAssignments} disabled={!editingTeam || updateMentorsMutation.isPending}>
              {updateMentorsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : 'Save Assignments'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="flex max-h-[92vh] w-full flex-col overflow-hidden p-0 sm:max-w-[min(96vw,1200px)]">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{activeBoardNumber ? `Assign Mentors to Board ${activeBoardNumber}` : 'Assign Mentors to Board'}</DialogTitle>
            <DialogDescription>
              {activeBoardNumber
                ? `This will replace mentor assignments for all ${teamsInSelectedBoard.length} team(s) currently grouped in board ${activeBoardNumber}.`
                : 'Select a board first to assign mentors in bulk.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Teams in this board</p>
                <div className="mt-3 space-y-2">
                  {teamsInSelectedBoard.map((team) => (
                    <div key={team.id} className="rounded-md border px-3 py-2">
                      <p className="text-sm font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground break-words">{team.event?.title}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Selected mentors</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedMentorIds.length > 0
                    ? mentors
                      .filter((mentor) => selectedMentorIds.includes(mentor.id))
                      .map((mentor) => (
                        <Badge key={mentor.id} variant="secondary">
                          {getMentorLabel(mentor)}
                        </Badge>
                      ))
                    : <span className="text-sm text-muted-foreground">No mentors selected.</span>}
                </div>
              </div>
            </div>

            <div className="min-h-0 rounded-lg border">
              <ScrollArea className="h-[260px] sm:h-[320px] lg:h-[360px]">
                <div className="space-y-3 p-4">
                  {mentors.length > 0 ? mentors.map((mentor) => {
                    const checked = selectedMentorIds.includes(mentor.id);
                    return (
                      <label key={mentor.id} className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleMentor(mentor.id, Boolean(value))}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium break-words">{mentor.fullName || mentor.email}</p>
                          <p className="text-xs text-muted-foreground break-all">{mentor.email}</p>
                        </div>
                      </label>
                    );
                  }) : (
                    <div className="rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground">
                    No active mentor accounts available.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="border-t bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setBulkAssignOpen(false)}
              disabled={assignBoardMentorsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={saveBoardAssignments}
              disabled={!activeBoardNumber || assignBoardMentorsMutation.isPending}
            >
              {assignBoardMentorsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : 'Assign Mentors to Board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
