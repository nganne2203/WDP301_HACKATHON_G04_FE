import type { Dispatch, SetStateAction } from 'react';

import type { Round, RubricStatus } from '@/shared/api/types';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import { rubricStatusOptions, type RubricFormState } from '../model/rubric-form';

export function RubricForm({
  form,
  onChange,
  rounds,
}: {
  form: RubricFormState;
  onChange: Dispatch<SetStateAction<RubricFormState>>;
  rounds: Round[];
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="rubric-title">Title</Label>
        <Input
          id="rubric-title"
          value={form.title}
          onChange={(competition) => onChange((current) => ({ ...current, title: competition.target.value }))}
          placeholder="Final Presentation Rubric"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rubric-description">Description</Label>
        <Textarea
          id="rubric-description"
          rows={4}
          value={form.description}
          onChange={(competition) => onChange((current) => ({ ...current, description: competition.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <Label>Round</Label>
          <Select value={form.roundId} onValueChange={(value) => onChange((current) => ({ ...current, roundId: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Reusable across rounds</SelectItem>
              {rounds.map((round) => (
                <SelectItem key={round.id} value={round.id}>
                  {round.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Total Weight</Label>
          <Select value={form.totalScore} onValueChange={(value) => onChange((current) => ({ ...current, totalScore: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 points</SelectItem>
              <SelectItem value="10">10 points</SelectItem>
              <SelectItem value="100">100 points</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">The sum of all criterion weights must equal this value before the rubric can leave Draft.</p>
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Scoring coefficient</Label>
          <Select value={form.criterionMaxScore} onValueChange={(value) => onChange((current) => ({ ...current, criterionMaxScore: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">0–4 points</SelectItem>
              <SelectItem value="10">0–10 points</SelectItem>
              <SelectItem value="100">0–100 points</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">The common scoring coefficient used for every criterion in this rubric.</p>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="rubric-version">Version</Label>
          <Input
            id="rubric-version"
            type="number"
            min="1"
            value={form.version}
            onChange={(competition) => onChange((current) => ({ ...current, version: competition.target.value }))}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value: RubricStatus) => onChange((current) => ({ ...current, status: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rubricStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
