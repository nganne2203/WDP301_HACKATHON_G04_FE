import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Loader2, MoreVertical, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { roundsApi } from '@/entities/round/api';
import { rubricsApi } from '@/entities/rubric/api';
import { teamsApi } from '@/entities/team/api';
import { tracksApi } from '@/entities/track/api';
import { usersApi } from '@/entities/user/api';
import { useStore } from '@/entities/session/model/store';
import type { CreateRoundRequest, Round, UpdateRoundRequest } from '@/shared/api/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  buildCreateRoundPayload,
  buildUpdateRoundPayload,
  createEmptyRoundForm,
  filterTeamsByTrack,
  formatDateTimeDisplay,
  getRoundErrorMessage,
  isJudgeUser,
  mapRoundToForm,
  type RoundFormState,
} from '../model/round-form';
import { RoundForm } from './RoundForm';

export function Rounds() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((state) => state.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [createForm, setCreateForm] = useState<RoundFormState>(createEmptyRoundForm());
  const [editForm, setEditForm] = useState<RoundFormState>(createEmptyRoundForm());

  const eventsQuery = useQuery({
    queryKey: ['coordinator-round-events'],
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
  });

  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return (
      events.find((event) => event.id === selectedEventId) ||
      events.find((event) => event.id === selectedEvent?.id) ||
      events[0]
    );
  }, [events, selectedEventId, selectedEvent?.id]);

  const roundsQuery = useQuery({
    queryKey: ['coordinator-rounds', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await roundsApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const tracksQuery = useQuery({
    queryKey: ['coordinator-round-tracks', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await tracksApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const rubricsQuery = useQuery({
    queryKey: ['coordinator-round-rubrics', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await rubricsApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const teamsQuery = useQuery({
    queryKey: ['coordinator-round-teams', activeEvent?.id],
    enabled: Boolean(activeEvent?.id),
    queryFn: async () => (await teamsApi.list({ eventId: activeEvent?.id, limit: 100 })).data,
  });

  const judgesQuery = useQuery({
    queryKey: ['coordinator-round-judges'],
    queryFn: async () => (await usersApi.list({ page: 1, limit: 100 })).data,
  });

  const rounds = roundsQuery.data || [];
  const tracks = tracksQuery.data || [];
  const rubrics = rubricsQuery.data || [];
  const teams = teamsQuery.data || [];
  const judges = (judgesQuery.data || []).filter(isJudgeUser);

  const createMutation = useMutation({
    mutationFn: (payload: CreateRoundRequest) => roundsApi.create(payload),
    onSuccess: (response) => {
      toast.success('Round created', { description: `${response.data.name} has been added.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-rounds'] });
      setCreateOpen(false);
      setCreateForm(createEmptyRoundForm());
    },
    onError: (error: unknown) => {
      toast.error('Failed to create round', { description: getRoundErrorMessage(error) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRoundRequest }) => roundsApi.update(id, payload),
    onSuccess: (response) => {
      toast.success('Round updated', { description: `${response.data.name} has been updated.` });
      queryClient.invalidateQueries({ queryKey: ['coordinator-rounds'] });
      setEditOpen(false);
      setSelectedRound(response.data);
    },
    onError: (error: unknown) => {
      toast.error('Failed to update round', { description: getRoundErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roundsApi.delete(id),
    onSuccess: () => {
      toast.success('Round deleted');
      queryClient.invalidateQueries({ queryKey: ['coordinator-rounds'] });
      setDeleteOpen(false);
      setSelectedRound(null);
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete round', { description: getRoundErrorMessage(error) });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Rounds Management</h1>
          <p className="text-sm text-muted-foreground">
            Configure competition rounds, scoring windows, assigned teams, and assigned judges.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="w-full sm:w-80">
            <Select value={activeEvent?.id || ''} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog
            open={createOpen}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open) setCreateForm(createEmptyRoundForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Round
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Round</DialogTitle>
                <DialogDescription>Set up a new round for {activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <RoundForm
                form={createForm}
                onChange={setCreateForm}
                tracks={tracks}
                rubrics={rubrics}
                teams={filterTeamsByTrack(teams, createForm.trackId)}
                judges={judges}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => activeEvent && createMutation.mutate(buildCreateRoundPayload(createForm, activeEvent.id))}
                  disabled={createMutation.isPending || !createForm.name.trim()}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Round'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(eventsQuery.error || roundsQuery.error || tracksQuery.error || rubricsQuery.error || teamsQuery.error || judgesQuery.error) && (
        <Alert>
          <AlertTitle>Unable to load round configuration data</AlertTitle>
          <AlertDescription>
            {getRoundErrorMessage(
              eventsQuery.error ||
              roundsQuery.error ||
              tracksQuery.error ||
              rubricsQuery.error ||
              teamsQuery.error ||
              judgesQuery.error
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Round</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Judges</TableHead>
              <TableHead>Window</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(eventsQuery.isLoading || roundsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading rounds...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!eventsQuery.isLoading && !roundsQuery.isLoading && rounds.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No rounds found for this event.
                </TableCell>
              </TableRow>
            )}

            {rounds.map((round) => (
              <TableRow key={round.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{round.name}</p>
                      <p className="text-xs text-muted-foreground">{round.roundType}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{round.track?.name || 'All tracks'}</TableCell>
                <TableCell>
                  <Badge variant={round.status === 'COMPLETED' ? 'default' : round.status === 'CLOSED' ? 'secondary' : 'outline'}>
                    {round.status}
                  </Badge>
                </TableCell>
                <TableCell>{round.assignedTeamIds.length}</TableCell>
                <TableCell>{round.assignedJudgeIds?.length || 0}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTimeDisplay(round.startTime)}
                  <br />
                  {formatDateTimeDisplay(round.endTime)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedRound(round);
                          setEditForm(mapRoundToForm(round));
                          setEditOpen(true);
                        }}
                      >
                        Edit round
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedRound(round);
                          setDeleteOpen(true);
                        }}
                      >
                        Delete round
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Round</DialogTitle>
            <DialogDescription>Update round metadata, assigned teams, and assigned judges.</DialogDescription>
          </DialogHeader>
          <RoundForm
            form={editForm}
            onChange={setEditForm}
            tracks={tracks}
            rubrics={rubrics}
            teams={filterTeamsByTrack(teams, editForm.trackId)}
            judges={judges}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedRound && updateMutation.mutate({ id: selectedRound.id, payload: buildUpdateRoundPayload(editForm) })}
              disabled={updateMutation.isPending || !editForm.name.trim()}
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete round</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{selectedRound?.name}"? Existing FE flows that reference this round will stop using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => selectedRound && deleteMutation.mutate(selectedRound.id)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
