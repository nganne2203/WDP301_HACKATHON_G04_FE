import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Loader2,
  Scale,
  Sparkles,
  Users,
} from 'lucide-react';

import { useJudgeDashboardView } from '../model/useJudgeDashboardView';
import { RepositoryEvidenceDialog } from '../../scoring/ui/RepositoryEvidenceDialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Progress } from '@/shared/ui/progress';

export function JudgeDashboardView() {
  const view = useJudgeDashboardView();
  const navigate = useNavigate();

  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const handleScoreTeam = (teamId: string) => {
    if (!view.activeEvent || !view.activeRound) return;
    navigate(`/judge/scoring?teamId=${teamId}&roundId=${view.activeRound.id}&eventId=${view.activeEvent.id}`);
  };

  const openEvidence = (repo: any) => {
    setSelectedRepo(repo);
    setEvidenceOpen(true);
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
            Manage your assignments, view automated n8n AI code reviews, and evaluate team submissions.
          </p>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-56">
            <Select
              value={view.activeEvent?.id || ''}
              onValueChange={view.setSelectedEventId}
              disabled={view.eventsQuery.isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Event" />
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
          <div className="w-full sm:w-56">
            <Select
              value={view.activeRound?.id || ''}
              onValueChange={view.setSelectedRoundId}
              disabled={!view.activeEvent || view.roundsQuery.isLoading}
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
          Loading dashboard data...
        </div>
      )}

      {/* Error state / Empty event & round selection */}
      {!view.isLoading && !view.activeRound && (
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Scale className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Ready to score?</AlertTitle>
          <AlertDescription className="text-blue-700">
            Please select an event and a evaluation round to display your assigned teams.
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
                  {view.criteriaCount} criteria · Max score: <strong className="text-gray-900 font-semibold">{view.maxScore} pts</strong>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Teams Table Section */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold">Assigned Teams list</CardTitle>
                <CardDescription>Click on any team to review submissions, inspect code audits, or fill score sheets.</CardDescription>
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
                        <th className="px-6 py-3">GitHub Audit (n8n AI / SAST)</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {view.assignedTeams.map((team) => {
                        const sub = view.submissionByTeam[team.id];
                        const sheet = view.sheetByTeamId.get(team.id);
                        const staticAnalysis = view.staticAnalysisByTeamId.get(team.id) || [];
                        const aiReviews = view.aiReviewsByTeamId.get(team.id);

                        const latestAnalysis = staticAnalysis[0] || null;
                        const latestAiReview = aiReviews?.aiReviews?.[0] || null;
                        const repository = aiReviews?.repository || sub?.repository || null;

                        // Scoring state logic
                        let statusBadge = (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                            <Clock className="w-3 h-3 mr-1 shrink-0" /> Unscored
                          </Badge>
                        );
                        if (sheet?.status === 'DRAFT') {
                          statusBadge = (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              <Clock className="w-3 h-3 mr-1 shrink-0" /> Draft ({sheet.totalScore} pts)
                            </Badge>
                          );
                        } else if (sheet?.status === 'SUBMITTED' || sheet?.status === 'LOCKED') {
                          statusBadge = (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" /> Submitted ({sheet.totalScore} pts)
                            </Badge>
                          );
                        }

                        return (
                          <tr key={team.id} className="hover:bg-gray-50/70 transition-colors">
                            {/* Team / Project */}
                            <td className="px-6 py-4">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{team.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{team.projectName || 'No project name linked'}</p>
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

                            {/* GitHub Audit (n8n AI / SAST) */}
                            <td className="px-6 py-4">
                              {sub?.repositoryId ? (
                                <div className="flex flex-col gap-1">
                                  {/* Repository name & Webhook status */}
                                  <div className="flex items-center gap-2">
                                    <span 
                                      onClick={() => openEvidence(repository)}
                                      className="text-xs font-mono font-medium text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                                      title="Inspect Repository Evidence"
                                    >
                                      <Code className="h-3.5 w-3.5" />
                                      {repository?.repositoryFullName || 'Inspect Code'}
                                    </span>
                                  </div>

                                  {/* n8n SAST Analysis Results */}
                                  <div className="flex items-center gap-2 mt-1">
                                    {latestAnalysis ? (
                                      <div className="flex gap-1.5">
                                        {latestAnalysis.errorCount > 0 && (
                                          <Badge variant="destructive" className="h-5 px-1.5 text-[10px] gap-1 flex items-center">
                                            <AlertTriangle className="h-2.5 w-2.5" /> {latestAnalysis.errorCount} Errors
                                          </Badge>
                                        )}
                                        {latestAnalysis.warningCount > 0 && (
                                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-amber-700 bg-amber-50 border-amber-200 gap-1 flex items-center">
                                            {latestAnalysis.warningCount} Warnings
                                          </Badge>
                                        )}
                                        {latestAnalysis.errorCount === 0 && latestAnalysis.warningCount === 0 && (
                                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-green-700 bg-green-50 border-green-200">
                                            Code Quality: OK
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-muted-foreground">n8n: No static run yet</span>
                                    )}

                                    {/* n8n AI Review */}
                                    {latestAiReview ? (
                                      <Badge 
                                        variant="outline" 
                                        className={`h-5 px-1.5 text-[10px] gap-1 flex items-center ${
                                          latestAiReview.needsHumanReview 
                                            ? 'text-red-700 bg-red-50 border-red-200' 
                                            : 'text-purple-700 bg-purple-50 border-purple-200'
                                        }`}
                                        title={latestAiReview.summary || 'AI Code review'}
                                      >
                                        <Bot className="h-3 w-3" />
                                        {latestAiReview.needsHumanReview ? 'AI Warning' : 'AI OK'}
                                      </Badge>
                                    ) : (
                                      <span className="text-[11px] text-muted-foreground">AI: Pending</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No GitHub linked</span>
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

      {/* Reusable Repository Evidence Dialog */}
      <RepositoryEvidenceDialog
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
        repository={selectedRepo}
      />
    </div>
  );
}
