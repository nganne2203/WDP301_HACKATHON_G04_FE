import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CalendarClock, ExternalLink, FileText, Loader2, Send, Trophy } from 'lucide-react';

import { useCompetitionsQuery, useMyTeamQuery, useRoundsQuery, selectDefaultCompetition } from '@/hooks/queries/useCommonQueries';
import { useStore } from '@/entities/session/model/store';
import type { Round } from '@/shared/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

function formatDateTime(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString();
}

function getTimeRemaining(target?: string | null, now = Date.now()) {
  if (!target) return 'No deadline';
  const diff = new Date(target).getTime() - now;
  if (Number.isNaN(diff)) return 'Invalid deadline';
  if (diff <= 0) return 'Time is up';

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function isRoundVisibleForTeam(round: Round, teamId?: string) {
  if (!round.assignedTeamIds?.length) return true;
  return Boolean(teamId && round.assignedTeamIds.includes(teamId));
}

function getRoundState(round: Round, now: number) {
  const start = round.startTime ? new Date(round.startTime).getTime() : null;
  const end = round.endTime ? new Date(round.endTime).getTime() : null;
  if (start && now < start) return 'Upcoming';
  if (end && now > end) return 'Ended';
  if (round.status === 'OPEN' || round.status === 'SCORING') return 'Open';
  return round.status;
}

function isSubmissionOpen(round: Round, now: number) {
  if (round.status !== 'OPEN') return false;
  const deadline = round.submissionDeadline ? new Date(round.submissionDeadline).getTime() : null;
  return !deadline || Number.isNaN(deadline) || deadline >= now;
}

export function ParticipantRoundsView() {
  const navigate = useNavigate();
  const storeSelectedCompetition = useStore((state) => state.selectedCompetition);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const eventsQuery = useCompetitionsQuery();
  const competitions = eventsQuery.data || [];

  const selectedCompetition = (storeSelectedCompetition ? competitions.find((competition) => competition.id === storeSelectedCompetition.id) : null) || selectDefaultCompetition(competitions) || competitions[0] || null;
  const activeCompetitionId = selectedCompetition?.id || '';
  const teamQuery = useMyTeamQuery(activeCompetitionId);
  const team = teamQuery.data;
  const roundsQuery = useRoundsQuery({ competitionId: activeCompetitionId, limit: 50 }, { enabled: Boolean(activeCompetitionId) });
  const rounds = useMemo(
    () => (roundsQuery.data || []).filter((round) => isRoundVisibleForTeam(round, team?.id)),
    [roundsQuery.data, team?.id]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold mb-1">Competition Rounds</h1>
          <p className="text-sm text-muted-foreground">View round schedules, exam content, Drive links, and promotion results.</p>
        </div>
      </div>

      {(eventsQuery.isLoading || teamQuery.isLoading || roundsQuery.isLoading) && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading round information</AlertTitle>
          <AlertDescription>Checking your team and available competition rounds.</AlertDescription>
        </Alert>
      )}

      {!teamQuery.isLoading && !team && selectedCompetition && (
        <Alert>
          <AlertTitle>No team found</AlertTitle>
          <AlertDescription>You need to create or join a team before round assignments can be matched to you.</AlertDescription>
        </Alert>
      )}

      {!roundsQuery.isLoading && rounds.length === 0 && (
        <Alert>
          <AlertTitle>No visible rounds yet</AlertTitle>
          <AlertDescription>The coordinator has not opened or assigned a competition round for your team yet.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {rounds.map((round) => {
          const promoted = Boolean(team?.id && round.promotedTeamIds?.includes(team.id));
          const canSubmit = isSubmissionOpen(round, now);
          return (
            <Card key={round.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarClock className="h-5 w-5 text-blue-600" />
                      {round.name}
                    </CardTitle>
                    <CardDescription>{round.roundType} · {round.track?.name || 'All tracks'}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={round.status === 'OPEN' ? 'default' : 'outline'}>{getRoundState(round, now)}</Badge>
                    {promoted && <Badge className="bg-green-600"><Trophy className="mr-1 h-3 w-3" />Advanced</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Start</p>
                    <p className="font-medium">{formatDateTime(round.startTime)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">End</p>
                    <p className="font-medium">{formatDateTime(round.endTime)}</p>
                  </div>
                  <div className="rounded-md border p-3 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Submission deadline</p>
                    <p className="font-medium">{formatDateTime(round.submissionDeadline)}</p>
                    <p className="text-xs text-blue-700">{getTimeRemaining(round.submissionDeadline || round.endTime, now)}</p>
                  </div>
                </div>

                <div className="rounded-md border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Problem Statement</p>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {round.problemStatement || 'The problem statement has not been published yet.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canSubmit && (
                    <Button onClick={() => navigate(`/participant/submissions?roundId=${round.id}`)}>
                      <Send className="mr-2 h-4 w-4" />
                      Submit deliverables
                    </Button>
                  )}
                  {round.examDriveUrl ? (
                    <Button asChild variant="outline">
                      <a href={round.examDriveUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open problem document
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>No Drive link yet</Button>
                  )}
                  {round.promotedTeamIds?.length > 0 && (
                    <Badge variant={promoted ? 'default' : 'secondary'}>
                      {promoted ? 'Your team goes to next round' : `${round.promotedTeamIds.length} team(s) promoted`}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
