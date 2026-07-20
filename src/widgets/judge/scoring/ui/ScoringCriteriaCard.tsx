import { Loader2, Save, Send } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { Textarea } from '@/shared/ui/textarea';
import type { Criterion } from '@/shared/api/types';

function formatScore(value: number) {
  return (Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100).toFixed(2);
}

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
  saveDisabled,
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
  saveDisabled?: boolean;
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
            <p className="text-lg font-bold text-blue-700">{formatScore(totalScore)}</p>
            <p className="text-xs text-muted-foreground">of {formatScore(maxScore)} pts</p>
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
              <span className="text-xs text-muted-foreground shrink-0">
                Max {formatScore(criterion.maxScore)} | Weight {formatScore(criterion.weight)}
              </span>
            </div>
            <Input
              type="number"
              min={0}
              max={criterion.maxScore}
              step="0.01"
              placeholder={`0-${formatScore(criterion.maxScore)}`}
              value={scores[criterion.id] ?? ''}
              disabled={isSubmitted}
              onChange={(competition) => {
                if (competition.target.value === '') {
                  setScores((current) => {
                    const next = { ...current };
                    delete next[criterion.id];
                    return next;
                  });
                  return;
                }
                const rawValue = Number(competition.target.value);
                if (!Number.isFinite(rawValue)) return;
                const value = Math.min(Math.max(0, rawValue), criterion.maxScore);
                setScores((current) => ({
                  ...current,
                  [criterion.id]: Math.round((value + Number.EPSILON) * 100) / 100,
                }));
              }}
              onBlur={() => {
                const value = scores[criterion.id];
                if (value === undefined) return;
                setScores((current) => ({
                  ...current,
                  [criterion.id]: Math.round((value + Number.EPSILON) * 100) / 100,
                }));
              }}
              className="w-28"
            />
            <Input
              placeholder="Comment (optional)"
              value={comments[criterion.id] || ''}
              disabled={isSubmitted}
              onChange={(competition) => setComments((current) => ({ ...current, [criterion.id]: competition.target.value }))}
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
            onChange={(competition) => setGeneralComment(competition.target.value)}
          />
        </div>

        {!isSubmitted && (
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onSaveDraft} disabled={saveDisabled || savePending}>
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
