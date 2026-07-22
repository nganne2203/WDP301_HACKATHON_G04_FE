import { Send } from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { AssignedTeamsPanel } from './AssignedTeamsPanel';
import { ScoringCriteriaCard } from './ScoringCriteriaCard';
import { SubmissionSummaryCard } from './SubmissionSummaryCard';
import { useJudgeScoringView } from '../model/useJudgeScoringView';

function formatScore(value: number) {
  return (Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100).toFixed(2);
}

export function JudgeScoring() {
  const view = useJudgeScoringView();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Score Teams</h1>
        <p className="text-sm text-muted-foreground">Evaluate teams assigned to your judging board</p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="w-full md:w-60">
          <Select value={view.activeRound?.id || ''} onValueChange={view.setSelectedRoundId} disabled={!view.activeCompetition || view.roundsQuery.isLoading}>
            <SelectTrigger><SelectValue placeholder={view.roundsQuery.isLoading ? 'Loading...' : 'Select round'} /></SelectTrigger>
            <SelectContent>
              {view.rounds.map((round) => (
                <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!view.activeRound && !view.roundsQuery.isLoading && (
        <Alert>
          <AlertTitle>No round selected</AlertTitle>
          <AlertDescription>Select an competition and round to start scoring.</AlertDescription>
        </Alert>
      )}

      {view.activeRound && view.assignedTeams.length === 0 && !view.boardQuery.isLoading && (
        <Alert>
          <AlertTitle>No teams assigned</AlertTitle>
          <AlertDescription>You have no teams assigned to score in this round yet.</AlertDescription>
        </Alert>
      )}

      {view.activeRound && view.assignedTeams.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AssignedTeamsPanel
            board={view.myBoard}
            assignedTeams={view.assignedTeams}
            selectedTeamId={view.selectedTeam?.id}
            onSelectTeam={view.setSelectedTeamId}
            sheetStatusByTeamId={view.sheetStatusByTeamId}
          />

          <div className="lg:col-span-2 space-y-4">
            {view.selectedTeam ? (
              <>
                {view.scoringGateMessage && (
                  <Alert>
                    <AlertTitle>Scoring not open</AlertTitle>
                    <AlertDescription>{view.scoringGateMessage}</AlertDescription>
                  </Alert>
                )}

                <SubmissionSummaryCard
                  teamName={view.selectedTeam.name}
                  submission={view.submission}
                  repository={view.repositoryQuery.data}
                  latestAnalysis={view.latestAnalysis}
                  latestAiReview={view.latestAiReview}
                  isSubmitted={view.isSubmitted}
                />

                <ScoringCriteriaCard
                  criteria={view.criteria}
                  maxScore={view.maxScore}
                  totalScore={view.totalScore}
                  scores={view.scores}
                  comments={view.comments}
                  generalComment={view.generalComment}
                  setScores={view.setScores}
                  setComments={view.setComments}
                  setGeneralComment={view.setGeneralComment}
                  isSubmitted={view.isSubmitted}
                  submitDisabled={
                    view.saveMutation.isPending ||
                    !view.scoringOpen ||
                    !view.submissionReady ||
                    !view.submission ||
                    !view.myBoard ||
                    view.hasIncompleteCriteria
                  }
                  saveDisabled={!view.scoringOpen || !view.submissionReady || !view.submission || !view.myBoard}
                  savePending={view.saveMutation.isPending}
                  onSaveDraft={() => view.saveMutation.mutate(false)}
                  onSubmit={() => view.setSubmitConfirm(true)}
                />
              </>
            ) : (
              <Alert>
                <AlertTitle>Select a team</AlertTitle>
                <AlertDescription>Choose a team from the list to start scoring.</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={view.submitConfirm} onOpenChange={view.setSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Score Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              You are submitting the score sheet for <strong>{view.selectedTeam?.name}</strong> with a total of{' '}
              <strong>{formatScore(view.totalScore)}</strong> final points. This cannot be modified after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => view.saveMutation.mutate(true)}>
              <Send className="w-4 h-4 mr-2" />
              Confirm Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
