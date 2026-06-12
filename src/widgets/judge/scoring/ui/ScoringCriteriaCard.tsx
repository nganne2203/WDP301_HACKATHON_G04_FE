import { Loader2, Save, Send } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { Textarea } from '@/shared/ui/textarea';
import type { Criterion } from '@/shared/api/types';

export function ScoringCriteriaCard({
  criteria,
  maxScore,
  totalScore,
  scores,
  comments,
  generalComment,
  setScores,
  setComments,
  setGeneralComment,
  isSubmitted,
  submitDisabled,
  savePending,
  onSaveDraft,
  onSubmit,
}: {
  criteria: Criterion[];
  maxScore: number;
  totalScore: number;
  scores: Record<string, number>;
  comments: Record<string, string>;
  generalComment: string;
  setScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setGeneralComment: React.Dispatch<React.SetStateAction<string>>;
  isSubmitted: boolean;
  submitDisabled: boolean;
  savePending: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  if (criteria.length === 0) {
    return (
      <Alert>
        <AlertTitle>No rubric assigned</AlertTitle>
        <AlertDescription>This round has no rubric. Contact the coordinator to assign one.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Scoring Criteria</CardTitle>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-700">{totalScore}</p>
            <p className="text-xs text-muted-foreground">of {maxScore} pts</p>
          </div>
        </div>
        <Progress value={maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0} />
      </CardHeader>
      <CardContent className="space-y-5">
        {criteria.map((criterion) => (
          <div key={criterion.id} className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="font-medium">{criterion.name}</Label>
                {criterion.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{criterion.maxScore} pts</span>
            </div>
            <Input
              type="number"
              min={0}
              max={criterion.maxScore}
              placeholder={`0-${criterion.maxScore}`}
              value={scores[criterion.id] ?? ''}
              disabled={isSubmitted}
              onChange={(event) => {
                const value = Math.min(Math.max(0, Number(event.target.value)), criterion.maxScore);
                setScores((current) => ({ ...current, [criterion.id]: value }));
              }}
              className="w-28"
            />
            <Input
              placeholder="Comment (optional)"
              value={comments[criterion.id] || ''}
              disabled={isSubmitted}
              onChange={(event) => setComments((current) => ({ ...current, [criterion.id]: event.target.value }))}
            />
          </div>
        ))}

        <div className="space-y-1 pt-2">
          <Label>General Comment</Label>
          <Textarea
            placeholder="Overall feedback for the team..."
            rows={3}
            value={generalComment}
            disabled={isSubmitted}
            onChange={(event) => setGeneralComment(event.target.value)}
          />
        </div>

        {!isSubmitted && (
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onSaveDraft} disabled={savePending}>
              {savePending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button onClick={onSubmit} disabled={submitDisabled}>
              <Send className="w-4 h-4 mr-2" />
              Submit Score
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
