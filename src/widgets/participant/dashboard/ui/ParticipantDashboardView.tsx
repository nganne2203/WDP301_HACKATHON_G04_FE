import { Link } from 'react-router';
import { AlertCircle, Calendar, CheckCircle2, Circle, Clock, Github, Loader2, Send, Trophy, Users } from 'lucide-react';

import { useParticipantDashboardView } from '../model/useParticipantDashboardView';
import { ParticipantCheckInScannerDialog } from './ParticipantCheckInScannerDialog';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

function formatDateTime(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString();
}

export function ParticipantDashboard() {
  const view = useParticipantDashboardView();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track your registration, team progress, submissions, and final results.</p>
        </div>
        <div className="w-full md:w-80">
          <Label>Event</Label>
          <Select
            value={view.selectedEvent?.id || ''}
            onValueChange={view.setSelectedEventId}
            disabled={view.eventsQuery.isLoading}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {view.events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view.eventsQuery.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading events</AlertTitle>
          <AlertDescription>Please wait while available events are loaded.</AlertDescription>
        </Alert>
      )}

      {view.urlCheckInMutation.isPending && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Processing check-in QR</AlertTitle>
          <AlertDescription>Please wait while your attendance is recorded.</AlertDescription>
        </Alert>
      )}

      {view.selectedEvent?.registrationEnd && (
        <Alert className="bg-blue-50 border-blue-200">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertTitle>Registration window</AlertTitle>
          <AlertDescription>
            Registration closes at {formatDateTime(view.selectedEvent.registrationEnd)}.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participation Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              {view.user?.status === 'ACTIVE' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
              <div className="flex-1">
                <p className="font-medium">Account Status</p>
                <p className="text-xs text-muted-foreground">{view.user?.status || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {view.participant ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300" />}
              <div className="flex-1">
                <p className="font-medium">Event Registration</p>
                <p className="text-xs text-muted-foreground">{view.participant?.status || 'Not registered in this event yet'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {view.participant?.checkInStatus === 'CHECKED_IN' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300" />}
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="font-medium">Check-in</p>
                  <p className="text-xs text-muted-foreground">{view.participant?.checkInStatus || 'Not checked in yet'}</p>
                </div>
                {view.participant && view.participant.checkInStatus !== 'CHECKED_IN' && (
                  <ParticipantCheckInScannerDialog />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {view.participant?.githubAccessStatus === 'GRANTED' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300" />}
              <div className="flex-1">
                <p className="font-medium">GitHub Access</p>
                <p className="text-xs text-muted-foreground">{view.participant?.githubAccessStatus || 'Not granted yet'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Team</CardTitle>
            <CardDescription>
              {view.team ? 'Your current team for the selected event.' : 'Create or join a team to continue.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {view.teamQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading team...
              </div>
            ) : view.team ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{view.team.name}</h3>
                    <Badge variant={view.team.leaderId === view.user?.id ? 'default' : 'secondary'}>
                      {view.team.leaderId === view.user?.id ? 'Leader' : 'Member'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{view.selectedEvent?.title}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{view.team.members.length} confirmed member(s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted-foreground" />
                    <span>{view.participant?.githubAccessStatus || 'No repository access yet'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <span>{view.teamRanking ? `Current rank: #${view.teamRanking.rank}` : 'Ranking not published yet'}</span>
                  </div>
                </div>
              </>
            ) : (
              <Alert>
                <AlertTitle>No team yet</AlertTitle>
                <AlertDescription>You need a team before you can submit deliverables.</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="w-full min-w-0">
                <Link to="/participant/team">Manage Team</Link>
              </Button>
              <Button asChild variant="outline" className="w-full min-w-0">
                <Link to="/participant/results">View Results</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission Status</CardTitle>
          <CardDescription>
            {view.rounds.length > 0
              ? `${view.completedSubmissionCount} of ${view.rounds.length} round submission(s) completed`
              : 'No rounds available yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Submission Progress</span>
              <span className="font-medium">{view.submissionProgress}%</span>
            </div>
            <Progress value={view.submissionProgress} />
          </div>

          {view.rounds.length > 0 ? (
            <div className="space-y-3">
              {view.rounds.map((round) => {
                const submission = view.submissions.find((item) => item.roundId === round.id) || null;
                return (
                  <div key={round.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium">{round.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Deadline: {formatDateTime(round.submissionDeadline)}
                      </p>
                    </div>
                    <Badge variant={submission?.status && submission.status !== 'DRAFT' ? 'default' : 'outline'}>
                      {submission?.status || 'NOT STARTED'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <Alert>
              <AlertTitle>No active rounds</AlertTitle>
              <AlertDescription>The coordinator has not published any round for this event yet.</AlertDescription>
            </Alert>
          )}

          <Button asChild className="w-full md:w-auto">
            <Link to="/participant/submissions">
              <Send className="w-4 h-4 mr-2" />
              Manage Submissions
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>Important milestones for the selected event.</CardDescription>
        </CardHeader>
        <CardContent>
          {view.timelinesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading timeline...
            </div>
          ) : view.timelineItems.length === 0 ? (
            <Alert>
              <AlertTitle>No timeline items</AlertTitle>
              <AlertDescription>The event timeline has not been configured yet.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {view.timelineItems.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  {item.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : item.status === 'ONGOING' ? (
                    <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-blue-100 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.title}</p>
                      <Badge variant="outline">{item.eventType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDateTime(item.startTime)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(view.teamRanking || view.isFinalist) && (
        <Card>
          <CardHeader>
            <CardTitle>Current Result Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">
                {view.teamRanking ? `${view.team?.name || 'Your team'} is ranked #${view.teamRanking.rank}` : 'No ranking yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {view.teamRanking ? `Score: ${view.teamRanking.score.toFixed(2)}` : 'Waiting for ranking generation.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {view.isFinalist && <Badge>Finalist</Badge>}
              <Button asChild variant="outline">
                <Link to="/participant/results">Open Full Results</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
