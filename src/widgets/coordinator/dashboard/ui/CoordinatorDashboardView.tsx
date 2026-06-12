import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { MetricCard } from '@/widgets/dashboard/ui/MetricCard';
import { EventStepper } from '@/widgets/dashboard/ui/EventStepper';
import {
  Users,
  UsersRound,
  ClipboardCheck,
  Github,
  Scale,
  Trophy,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Progress } from '@/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useEventsQuery, useRoundsQuery } from '@/hooks/queries/useCommonQueries';
import { useStore } from '@/entities/session/model/store';
import { queryKeys } from '@/lib/queryKeys';
import { participantsApi } from '@/shared/api/participants';
import { repositoriesApi } from '@/shared/api/repositories';
import { scoringApi } from '@/shared/api/scoring';
import { submissionsApi } from '@/shared/api/submissions';
import { teamsApi } from '@/shared/api/teams';
import { rankingsApi } from '@/shared/api/rankings';
import { auditApi } from '@/shared/api/audit';
import { timelinesApi } from '@/shared/api/timelines';
import type { AuditLog, Event, Ranking, Round, ScoreSheet, Submission, TimelineEvent } from '@/shared/api/types';

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function uniqueCount(values: Array<string | null | undefined>) {
  return new Set(values.filter(Boolean)).size;
}

function getActiveEvent(events: Event[], selectedEventId?: string) {
  return (
    events.find((event) => event.id === selectedEventId) ||
    events.find((event) => event.status === 'ONGOING') ||
    events.find((event) => event.status === 'OPEN_REGISTRATION') ||
    events[0] ||
    null
  );
}

function toSelectedEvent(event: Event) {
  return {
    id: event.id,
    title: event.title,
    semester: event.semester || event.season || String(event.year || ''),
    status: event.status,
  };
}

function getCurrentRound(rounds: Round[]) {
  return (
    rounds.find((round) => round.status === 'SCORING') ||
    rounds.find((round) => round.status === 'OPEN') ||
    rounds.find((round) => round.status === 'CLOSED') ||
    rounds[0] ||
    null
  );
}

function getTimelineTime(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function buildLifecycleSteps(timelines: TimelineEvent[]) {
  return [...timelines]
    .sort((a, b) => getTimelineTime(a.startTime) - getTimelineTime(b.startTime))
    .map((timeline) => ({
      label: timeline.title,
      status: (timeline.status === 'COMPLETED'
        ? 'completed'
        : timeline.status === 'ONGOING'
          ? 'active'
          : 'pending') as 'completed' | 'active' | 'pending',
    }));
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

function formatAuditText(log: AuditLog) {
  const actor = log.user?.fullName || log.user?.email || 'System';
  const action = log.action.toLowerCase().replace(/_/g, ' ');
  const resource = log.resourceType ? log.resourceType.toLowerCase().replace(/_/g, ' ') : 'record';

  return `${actor} ${action} ${resource}`;
}

export function CoordinatorDashboard() {
  const selectedEventId = useStore((state) => state.selectedEvent?.id);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);
  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => getActiveEvent(events, selectedEventId), [events, selectedEventId]);
  const activeEventId = activeEvent?.id;
  const ongoingEvent = events.find((event) => event.status === 'ONGOING') || null;

  const handleSelectEvent = (eventId: string) => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    setSelectedEvent(toSelectedEvent(event));
  };

  const handleSelectOngoingEvent = () => {
    if (!ongoingEvent) return;
    setSelectedEvent(toSelectedEvent(ongoingEvent));
  };

  const participantsQuery = useQuery({
    queryKey: queryKeys.participants.list({ eventId: activeEventId, limit: 10 }),
    enabled: Boolean(activeEventId),
    queryFn: () => participantsApi.list({ eventId: activeEventId, limit: 10 }),
  });

  const teamsQuery = useQuery({
    queryKey: [...queryKeys.teams.all, 'dashboard', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: () => teamsApi.list({ eventId: activeEventId, limit: 10 }),
  });

  const roundsQuery = useRoundsQuery(
    { eventId: activeEventId, limit: 10 },
    { enabled: Boolean(activeEventId) }
  );

  const submissionsQuery = useQuery({
    queryKey: queryKeys.submissions.list({ eventId: activeEventId, limit: 10 }),
    enabled: Boolean(activeEventId),
    queryFn: async () => (await submissionsApi.list({ eventId: activeEventId, limit: 10 })).data,
  });

  const repositoriesQuery = useQuery({
    queryKey: [...queryKeys.repositories.all, 'dashboard', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: () => repositoriesApi.list({ eventId: activeEventId, limit: 10 }),
  });

  const checkedInQuery = useQuery({
    queryKey: queryKeys.participants.list({ eventId: activeEventId, checkInStatus: 'CHECKED_IN', limit: 10 }),
    enabled: Boolean(activeEventId),
    queryFn: () => participantsApi.list({ eventId: activeEventId, checkInStatus: 'CHECKED_IN', limit: 10 }),
  });

  const timelinesQuery = useQuery({
    queryKey: [...queryKeys.timelines.all, 'dashboard', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: () => timelinesApi.list({ eventId: activeEventId, page: 1, limit: 10 }),
  });

  const auditLogsQuery = useQuery({
    queryKey: queryKeys.auditLogs.list({ page: 1, limit: 5 }),
    queryFn: () => auditApi.list({ page: 1, limit: 5 }),
  });

  const rounds = roundsQuery.data || [];
  const activeRound = useMemo(() => getCurrentRound(rounds), [rounds]);

  const scoreSheetsQuery = useQuery({
    queryKey: queryKeys.scoreSheets.list({ eventId: activeEventId, roundId: activeRound?.id, limit: 10 }),
    enabled: Boolean(activeEventId && activeRound?.id),
    queryFn: () => scoringApi.listSheets({ eventId: activeEventId, roundId: activeRound?.id, limit: 10 }),
  });

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.list(activeEventId, activeRound?.id),
    enabled: Boolean(activeEventId && activeRound?.id),
    queryFn: async () => (
      await rankingsApi.list({ eventId: activeEventId, roundId: activeRound?.id, limit: 10 })
    ).data,
  });

  const participants = participantsQuery.data?.data || [];
  const teams = teamsQuery.data?.data || [];
  const submissions: Submission[] = submissionsQuery.data || [];
  const repositories = repositoriesQuery.data?.data || [];
  const scoreSheets: ScoreSheet[] = scoreSheetsQuery.data?.data || [];
  const rankings: Ranking[] = rankingsQuery.data || [];
  const timelines = timelinesQuery.data?.data || [];
  const auditPayload = auditLogsQuery.data?.data as AuditLog[] | { auditLogs?: AuditLog[] } | undefined;
  const auditLogs = Array.isArray(auditPayload) ? auditPayload : auditPayload?.auditLogs || [];

  const totalParticipants = participantsQuery.data?.pagination?.totalItems ?? participants.length;
  const totalTeams = teamsQuery.data?.pagination?.totalItems ?? teams.length;
  const totalRepositories = repositoriesQuery.data?.pagination?.totalItems ?? repositories.length;
  const checkedIn = checkedInQuery.data?.pagination?.totalItems ?? participants.filter((participant) => participant.checkInStatus === 'CHECKED_IN').length;
  const teamsEvaluated = uniqueCount(
    scoreSheets
      .filter((sheet) => sheet.status === 'SUBMITTED' || sheet.status === 'LOCKED')
      .map((sheet) => sheet.teamId)
  );
  const submissionsReceived = uniqueCount(
    submissions
      .filter((submission) => submission.status !== 'DRAFT')
      .map((submission) => submission.teamId)
  );
  const repoAccess = totalRepositories || uniqueCount(
    participants
      .filter((participant) => participant.githubAccessStatus === 'GRANTED')
      .map((participant) => participant.team?.id)
  );
  const finalists = rankings.filter((ranking) => ranking.isSelectedForFinal).length;
  const maxTeams = activeEvent?.maxTeams || totalTeams;
  const finalistSlots = activeEvent?.totalFinalistSlots || activeEvent?.finalistSlotsPerTrack || finalists;
  const judgingProgress = percent(teamsEvaluated, totalTeams);
  const loadingValue = eventsQuery.isLoading || participantsQuery.isLoading || teamsQuery.isLoading;
  const lifecycleSteps = buildLifecycleSteps(timelines);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage all aspects of the hackathon
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border bg-white p-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Event scope</p>
            <Select value={activeEventId || ''} onValueChange={handleSelectEvent} disabled={eventsQuery.isLoading}>
              <SelectTrigger className="w-full min-w-0">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent className="max-w-[min(560px,calc(100vw-2rem))]">
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id} className="max-w-[520px]">
                    <span className="block truncate">
                      {event.title} - {event.status.replace('_', ' ')}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant={activeEvent?.status === 'ONGOING' ? 'default' : 'outline'}
            className="w-full shrink-0 sm:mt-5 sm:w-auto"
            disabled={!ongoingEvent || eventsQuery.isLoading}
            onClick={handleSelectOngoingEvent}
          >
            Event đang diễn ra
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Participants"
          value={loadingValue ? '...' : totalParticipants}
          icon={Users}
        />
        <MetricCard
          title="Teams Formed"
          value={loadingValue ? '...' : totalTeams}
          subtitle={maxTeams ? `/ ${maxTeams}` : undefined}
          icon={UsersRound}
        />
        <MetricCard
          title="Check-in Rate"
          value={loadingValue ? '...' : `${percent(checkedIn, totalParticipants)}%`}
          icon={ClipboardCheck}
        />
        <MetricCard
          title="Judging Progress"
          value={loadingValue ? '...' : `${judgingProgress}%`}
          icon={Scale}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          {timelinesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading event timeline...</p>
          ) : lifecycleSteps.length > 0 ? (
            <EventStepper steps={lifecycleSteps} />
          ) : (
            <p className="text-sm text-muted-foreground">No timeline items configured for this event.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-muted-foreground" />
                  <span>Repository Access Granted</span>
                </div>
                <span className="font-medium">{repoAccess} / {totalTeams}</span>
              </div>
              <Progress value={percent(repoAccess, totalTeams)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-muted-foreground" />
                  <span>Teams Evaluated</span>
                </div>
                <span className="font-medium">{teamsEvaluated} / {totalTeams}</span>
              </div>
              <Progress value={judgingProgress} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-muted-foreground" />
                  <span>Submissions Received</span>
                </div>
                <span className="font-medium">{submissionsReceived} / {totalTeams}</span>
              </div>
              <Progress value={percent(submissionsReceived, totalTeams)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span>Finalists Selected</span>
                </div>
                <span className="font-medium">{finalists} / {finalistSlots}</span>
              </div>
              <Progress value={percent(finalists, finalistSlots)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs.length > 0 ? (
                auditLogs.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm">{formatAuditText(activity)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
