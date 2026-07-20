import { useNavigate } from 'react-router';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Loader2,
  Scale,
  Sparkles,
  Users,
} from 'lucide-react';

import { useJudgeDashboardView } from '../model/useJudgeDashboardView';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Progress } from '@/shared/ui/progress';

function formatScore(value?: number | null) {
  const score = Number(value ?? 0);
  return Number.isFinite(score) ? String(Number(score.toFixed(2))) : '0';
}

export function JudgeDashboardView() {
  const view = useJudgeDashboardView();
  const navigate = useNavigate();

  const handleScoreTeam = (teamId: string) => {
    if (!view.activeCompetition || !view.activeRound) return;
    navigate(`/judge/scoring?teamId=${teamId}&roundId=${view.activeRound.id}&competitionId=${view.activeCompetition.id}`);
  };

  const progressPercent = view.totalTeamsCount > 0 
    ? Math.round((view.scoredTeamsCount / view.totalTeamsCount) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-blue-600" />
            Judge Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your assignments, track scoring progress, and evaluate team submissions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-56">
            <Select
              value={view.activeRound?.id || ''}
              onValueChange={view.setSelectedRoundId}
              disabled={!view.activeCompetition || view.roundsQuery.isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={view.roundsQuery.isLoading ? 'Loading rounds...' : 'Select Round'} />
              </SelectTrigger>
              <SelectContent>
                {view.rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {view.isLoading && (
        <div className="flex items-center justify-center py-20 gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Loading dashboard...
        </div>
      )}

      {/* Error state / Empty competition & round selection */}
      {!view.isLoading && !view.activeRound && (
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Scale className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Ready to score?</AlertTitle>
          <AlertDescription className="text-blue-700">
            Please select an competition and a evaluation round to display your assigned teams.
          </AlertDescription>
        </Alert>
      )}

      {/* Main dashboard content */}
      {!view.isLoading && view.activeRound && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Completion Progress Card */}
            <Card className="relative overflow-hidden border border-blue-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Scoring Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{view.scoredTeamsCount}</span>
                  <span className="text-sm text-muted-foreground">/ {view.totalTeamsCount} teams</span>
                </div>
                <div className="space-y-1">
                  <Progress value={progressPercent} className="h-2 bg-gray-100" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progressPercent}% Complete</span>
                    {view.draftTeamsCount > 0 && (
                      <span className="text-amber-600 font-medium">{view.draftTeamsCount} draft(s)</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Assigned Card */}
            <Card className="border border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  Assigned Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{view.totalTeamsCount}</div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {view.pendingTeamsCount > 0 
                    ? `${view.pendingTeamsCount} teams remaining to score`
                    : 'All teams successfully evaluated'}
                </p>
              </CardContent>
            </Card>

            {/* Average Score Given */}
            <Card className="border border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Average Score Given
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{view.averageScoreGiven}</div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Based on {view.scoredTeamsCount} submitted score sheet(s)
                </p>
              </CardContent>
            </Card>

            {/* Active Rubric Info */}
            <Card className="border border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Active Rubric
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold truncate" title={view.rubricName}>
                  {view.rubricName}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {view.criteriaCount} criteria · Scoring coefficient: <strong className="text-gray-900 font-semibold">{view.scoringCoefficient}</strong> · Total Weight: <strong className="text-gray-900 font-semibold">{view.totalWeight}</strong>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Teams Table Section */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold">Assigned Teams list</CardTitle>
                <CardDescription>Click on any team to review submissions or fill score sheets.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {view.myBoard?.name || 'Evaluation Board'}
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {view.assignedTeams.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  You are not assigned to score any teams for the selected round.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3">Team / Project</th>
                        <th className="px-6 py-3">Evidence Links</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {view.assignedTeams.map((team) => {
                        const sub = view.submissionByTeam[team.id];
                        const sheet = view.sheetByTeamId.get(team.id);
                        // Scoring state logic
                        let statusBadge = (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            <Clock className="w-3 h-3 mr-1 shrink-0" /> Unscored
                          </Badge>
                        );
                        if (sheet?.status === 'DRAFT') {
                          statusBadge = (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <Clock className="w-3 h-3 mr-1 shrink-0" /> Draft ({formatScore(sheet.finalScore)} pts)
                            </Badge>
                          );
                        } else if (sheet?.status === 'SUBMITTED' || sheet?.status === 'LOCKED') {
                          statusBadge = (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" /> Submitted ({formatScore(sheet.finalScore)} pts)
                            </Badge>
                          );
                        }

                        return (
                          <tr key={team.id} className="hover:bg-gray-50/70 transition-colors">
                            {/* Team */}
                            <td className="px-6 py-4">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{team.name}</p>
                              </div>
                            </td>

                            {/* Evidence Links */}
                            <td className="px-6 py-4">
                              {sub ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {sub.demoUrl && (
                                    <a href={sub.demoUrl} target="_blank" rel="noreferrer" title="Demo Link">
                                      <Badge variant="secondary" className="hover:bg-gray-200 transition-colors cursor-pointer text-xs flex items-center gap-1">
                                        <ExternalLink className="h-3 w-3" /> Demo
                                      </Badge>
                                    </a>
                                  )}
                                  {sub.reportUrl && (
                                    <a href={sub.reportUrl} target="_blank" rel="noreferrer" title="Report PDF">
                                      <Badge variant="secondary" className="hover:bg-gray-200 transition-colors cursor-pointer text-xs flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> Report
                                      </Badge>
                                    </a>
                                  )}
                                  {sub.presentationUrl && (
                                    <a href={sub.presentationUrl} target="_blank" rel="noreferrer" title="Slides">
                                      <Badge variant="secondary" className="hover:bg-gray-200 transition-colors cursor-pointer text-xs flex items-center gap-1">
                                        <ExternalLink className="h-3 w-3" /> Slides
                                      </Badge>
                                    </a>
                                  )}
                                  {!sub.demoUrl && !sub.reportUrl && !sub.presentationUrl && (
                                    <span className="text-xs text-muted-foreground">No custom links</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 text-center">
                              {statusBadge}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              {sheet?.status === 'SUBMITTED' || sheet?.status === 'LOCKED' ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleScoreTeam(team.id)}
                                >
                                  View Score
                                </Button>
                              ) : (
                                <Button 
                                  variant={sheet?.status === 'DRAFT' ? 'secondary' : 'default'}
                                  size="sm" 
                                  className={sheet?.status !== 'DRAFT' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                                  onClick={() => handleScoreTeam(team.id)}
                                  disabled={!sub}
                                  title={!sub ? 'Cannot score team without submission' : ''}
                                >
                                  {sheet?.status === 'DRAFT' ? 'Resume Scoring' : 'Start Scoring'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

    </div>
  );
}
