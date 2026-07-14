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
          onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
          placeholder="Final Presentation Rubric"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rubric-description">Description</Label>
        <Textarea
          id="rubric-description"
          rows={4}
          value={form.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(8rem,0.7fr)_minmax(7rem,0.65fr)_minmax(9rem,0.85fr)]">
        <div className="min-w-0 space-y-2">
          <Label>Round</Label>
          <Select value={form.roundId} onValueChange={(value) => onChange((current) => ({ ...current, roundId: value }))}>
            <SelectTrigger>
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
          <Label>Scale</Label>
          <Select value={form.totalScore} onValueChange={(value) => onChange((current) => ({ ...current, totalScore: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 pts</SelectItem>
              <SelectItem value="10">10 pts</SelectItem>
              <SelectItem value="100">100 pts</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="rubric-version">Version</Label>
          <Input
            id="rubric-version"
            type="number"
            min="1"
            value={form.version}
            onChange={(event) => onChange((current) => ({ ...current, version: event.target.value }))}
          />
        </div>
        <div className="min-w-0 space-y-2 sm:col-span-2 lg:col-span-1">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value: RubricStatus) => onChange((current) => ({ ...current, status: value }))}>
            <SelectTrigger>
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
