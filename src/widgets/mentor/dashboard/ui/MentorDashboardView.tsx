import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Loader2, MessageSquare, Presentation, RefreshCw, UsersRound, Video } from 'lucide-react';

import { teamsApi } from '@/entities/team/api';
import { useStore } from '@/entities/session/model/store';
import { useEventsQuery, useWorkshopsQuery, selectDefaultEvent } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { workshopsApi } from '@/shared/api/workshops';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

function formatDateTime(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString();
}

export function MentorDashboardView() {
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const selectedEvent = useStore((state) => state.selectedEvent);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);
  const [selectedSpeakerWorkshopId, setSelectedSpeakerWorkshopId] = useState<string>('');

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];

  // Initialize selectedEvent in store if not present and events are available
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      const defaultEvent = selectDefaultEvent(events) || events[0];
      setSelectedEvent({
        id: defaultEvent.id,
        title: defaultEvent.title,
        semester: defaultEvent.semester,
        status: defaultEvent.status,
      });
    }
  }, [events, selectedEvent, setSelectedEvent]);

  const workshopsQuery = useWorkshopsQuery(
    { eventId: selectedEvent?.id, presenterId: user?.id, limit: 20 },
    { enabled: Boolean(selectedEvent?.id && user?.id) }
  );
  const workshops = workshopsQuery.data || [];

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams.list({ eventId: selectedEvent?.id, limit: 10 }),
    enabled: Boolean(selectedEvent?.id),
    queryFn: async () => (await teamsApi.list({ eventId: selectedEvent?.id, limit: 10 })).data,
  });
  const teams = teamsQuery.data || [];

  const activeWorkshops = workshops.filter((workshop) => workshop.status === 'LIVE' || workshop.status === 'SCHEDULED');
  const confirmedTeams = teams.filter((team) => team.status === 'CONFIRMED');
  const latestWorkshops = [...workshops]
    .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime())
    .slice(0, 3);
  const isSpeaker = appRole === 'speaker';
  const speakerWorkshopOptions = useMemo(
    () =>
      [...workshops].sort((left, right) => {
        const leftTime = new Date(left.startTime).getTime();
        const rightTime = new Date(right.startTime).getTime();
        return leftTime - rightTime;
      }),
    [workshops]
  );
  const defaultSpeakerWorkshop = useMemo(
    () =>
      speakerWorkshopOptions.find((workshop) => workshop.status === 'LIVE') ||
      speakerWorkshopOptions.find((workshop) => workshop.status === 'SCHEDULED') ||
      speakerWorkshopOptions[0],
    [speakerWorkshopOptions]
  );
  const selectedSpeakerWorkshop =
    speakerWorkshopOptions.find((workshop) => workshop.id === selectedSpeakerWorkshopId) || defaultSpeakerWorkshop;

  useEffect(() => {
    if (!isSpeaker) {
      if (selectedSpeakerWorkshopId) setSelectedSpeakerWorkshopId('');
      return;
    }

    if (selectedSpeakerWorkshop && selectedSpeakerWorkshop.id !== selectedSpeakerWorkshopId) {
      setSelectedSpeakerWorkshopId(selectedSpeakerWorkshop.id);
    }
  }, [isSpeaker, selectedSpeakerWorkshop, selectedSpeakerWorkshopId]);

  const speakerQuestionsQuery = useQuery({
    queryKey: queryKeys.workshops.questions(selectedSpeakerWorkshop?.id, { page: 1, limit: 20 }),
    enabled: Boolean(isSpeaker && selectedSpeakerWorkshop?.id),
    queryFn: async () => (await workshopsApi.listQuestions(selectedSpeakerWorkshop!.id, { page: 1, limit: 20 })).data,
  });
  const speakerQuestions = useMemo(
    () =>
      [...(speakerQuestionsQuery.data || [])].sort((left, right) => {
        if (right.voteCount !== left.voteCount) return right.voteCount - left.voteCount;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [speakerQuestionsQuery.data]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold mb-1">{isSpeaker ? 'Speaker Dashboard' : 'Mentor Dashboard'}</h1>
          <p className="text-sm text-muted-foreground">
            {isSpeaker
              ? 'Track your workshop schedule and event context.'
              : 'Track your mentoring sessions and get a quick event snapshot.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Presentation className="w-4 h-4" />
              {isSpeaker ? 'My Sessions' : 'My Workshops'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{workshops.length}</p>
            <p className="text-sm text-muted-foreground mt-1">{activeWorkshops.length} active or upcoming</p>
          </CardContent>
        </Card>
        {!isSpeaker && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UsersRound className="w-4 h-4" />
              Assigned Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{confirmedTeams.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Confirmed teams in your mentoring scope</p>
          </CardContent>
        </Card>
        )}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Event Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{selectedEvent?.status || '—'}</p>
            <p className="text-sm text-muted-foreground mt-1">{selectedEvent?.title || 'No event selected'}</p>
          </CardContent>
        </Card>
      </div>



      <div className={`grid grid-cols-1 gap-6 ${isSpeaker ? 'lg:grid-cols-[1fr_1fr]' : 'lg:grid-cols-[1.2fr_0.8fr]'}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming Sessions</CardTitle>
            {!isSpeaker && <Button asChild variant="outline" size="sm">
              <Link to="/mentor/teams">Open Team View</Link>
            </Button>}
          </CardHeader>
          <CardContent className="space-y-3">
            {workshopsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading workshops...
              </div>
            ) : latestWorkshops.length === 0 ? (
              <Alert>
                <AlertTitle>{isSpeaker ? 'No speaking sessions' : 'No mentoring workshops'}</AlertTitle>
                <AlertDescription>
                  {isSpeaker
                    ? 'No workshops are assigned to you as presenter for the selected event.'
                    : 'No workshops are assigned to you for the selected event.'}
                </AlertDescription>
              </Alert>
            ) : (
              latestWorkshops.map((workshop) => (
                <div key={workshop.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{workshop.title}</p>
                      <p className="text-sm text-muted-foreground">{workshop.event?.title || selectedEvent?.title}</p>
                    </div>
                    <Badge variant="outline">{workshop.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{formatDateTime(workshop.startTime)}</p>
                  {workshop.meetLink && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                      <Video className="w-4 h-4" />
                      <a href={workshop.meetLink} target="_blank" rel="noreferrer" className="underline">
                        {isSpeaker ? 'Open session link' : 'Open mentoring link'}
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {isSpeaker && (
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Participant Questions</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions submitted by participants for your assigned workshop.
                </p>
              </div>
              {selectedSpeakerWorkshop?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakerQuestionsQuery.refetch()}
                  disabled={speakerQuestionsQuery.isFetching}
                >
                  {speakerQuestionsQuery.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh
                </Button>
              )}
            </div>
            {speakerWorkshopOptions.length > 0 && (
              <div className="space-y-1">
                <Label>Workshop</Label>
                <Select value={selectedSpeakerWorkshop?.id || ''} onValueChange={setSelectedSpeakerWorkshopId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select workshop" />
                  </SelectTrigger>
                  <SelectContent>
                    {speakerWorkshopOptions.map((workshop) => (
                      <SelectItem key={workshop.id} value={workshop.id}>
                        {workshop.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedSpeakerWorkshop ? (
              <Alert>
                <AlertTitle>No workshop selected</AlertTitle>
                <AlertDescription>You need at least one assigned workshop before participant questions can appear here.</AlertDescription>
              </Alert>
            ) : speakerQuestionsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading participant questions...
              </div>
            ) : speakerQuestions.length === 0 ? (
              <Alert>
                <AlertTitle>No participant questions yet</AlertTitle>
                <AlertDescription>
                  Participants have not submitted any questions for "{selectedSpeakerWorkshop.title}" yet.
                </AlertDescription>
              </Alert>
            ) : (
              speakerQuestions.map((question) => (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-2">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-relaxed">{question.content}</p>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{question.author?.fullName || question.author?.email || 'Anonymous participant'}</span>
                        <span>{formatDateTime(question.createdAt)}</span>
                        <span>{question.voteCount} votes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        )}

        {!isSpeaker && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" variant="outline">
              <Link to="/mentor/teams">Browse Event Teams</Link>
            </Button>
            {selectedEvent?.id && (
              <Button asChild className="w-full" variant="outline">
                <Link to={`/events/${selectedEvent.id}/gallery`}>Open Event Gallery</Link>
              </Button>
            )}

          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
