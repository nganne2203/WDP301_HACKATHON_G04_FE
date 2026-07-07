import type { Dispatch, SetStateAction } from 'react';
import { Users } from 'lucide-react';

import type { RoundStatus, RoundType, Rubric, Team, Track, User } from '@/shared/api/types';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import {
  getCurrentDateTimeLocalInputValue,
  roundStatusOptions,
  roundTypeOptions,
  toggleId,
  type RoundFormState,
} from '../model/round-form';

export function RoundForm({
  form,
  onChange,
  tracks,
  rubrics,
  teams,
  judges,
}: {
  form: RoundFormState;
  onChange: Dispatch<SetStateAction<RoundFormState>>;
  tracks: Track[];
  rubrics: Rubric[];
  teams: Team[];
  judges: User[];
}) {
  const now = getCurrentDateTimeLocalInputValue();

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="round-name">Round Name</Label>
          <Input id="round-name" value={form.name} onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))} placeholder="Preliminary Round" />
        </div>
        <div className="space-y-2">
          <Label>Round Type</Label>
          <Select value={form.roundType} onValueChange={(value: RoundType) => onChange((current) => ({ ...current, roundType: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {roundTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Track</Label>
          <Select
            value={form.trackId}
            onValueChange={(value) =>
              onChange((current) => ({
                ...current,
                trackId: value,
                assignedTeamIds: current.trackId === value ? current.assignedTeamIds : [],
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All tracks</SelectItem>
              {tracks.map((track) => (
                <SelectItem key={track.id} value={track.id}>{track.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Rubric</Label>
          <Select value={form.rubricId} onValueChange={(value) => onChange((current) => ({ ...current, rubricId: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No rubric yet</SelectItem>
              {rubrics.map((rubric) => (
                <SelectItem key={rubric.id} value={rubric.id}>{rubric.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value: RoundStatus) => onChange((current) => ({ ...current, status: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {roundStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DateTimeField
          id="round-start"
          label="Start Time"
          value={form.startTime}
          min={now}
          onChange={(value) => onChange((current) => ({ ...current, startTime: value }))}
        />
        <DateTimeField
          id="round-end"
          label="End Time"
          value={form.endTime}
          min={form.startTime || now}
          onChange={(value) => onChange((current) => ({ ...current, endTime: value }))}
        />
        <DateTimeField
          id="round-deadline"
          label="Submission Deadline"
          value={form.submissionDeadline}
          min={now}
          onChange={(value) => onChange((current) => ({ ...current, submissionDeadline: value }))}
        />
        <DateTimeField
          id="round-publish"
          label="Publish Time"
          value={form.publishTime}
          min={form.endTime || now}
          onChange={(value) => onChange((current) => ({ ...current, publishTime: value }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="round-max-promoted">Max Promoted Teams</Label>
          <Input id="round-max-promoted" type="number" min="1" value={form.maxPromotedTeams} onChange={(event) => onChange((current) => ({ ...current, maxPromotedTeams: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="round-tie-duration">Tie-break Duration (minutes)</Label>
          <Input id="round-tie-duration" type="number" min="1" value={form.tieBreakDurationMinutes} onChange={(event) => onChange((current) => ({ ...current, tieBreakDurationMinutes: event.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="round-promotion-rule">Promotion Rule</Label>
          <Textarea id="round-promotion-rule" rows={3} value={form.promotionRule} onChange={(event) => onChange((current) => ({ ...current, promotionRule: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="round-tie-break-rule">Tie-break Rule</Label>
          <Textarea id="round-tie-break-rule" rows={3} value={form.tieBreakRule} onChange={(event) => onChange((current) => ({ ...current, tieBreakRule: event.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="round-problem-statement">Problem Statement</Label>
          <Textarea
            id="round-problem-statement"
            rows={5}
            value={form.problemStatement}
            onChange={(event) => onChange((current) => ({ ...current, problemStatement: event.target.value }))}
            placeholder="Describe the exam problem, constraints, and expected deliverables."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="round-drive-url">Exam Drive Link</Label>
          <Input
            id="round-drive-url"
            value={form.examDriveUrl}
            onChange={(event) => onChange((current) => ({ ...current, examDriveUrl: event.target.value }))}
            placeholder="https://drive.google.com/..."
          />
        </div>
      </div>

      <SelectionList
        label={`Assigned Teams (${form.assignedTeamIds.length})`}
        items={teams.map((team) => ({ id: team.id, primary: team.name, secondary: team.status }))}
        selectedIds={form.assignedTeamIds}
        onToggle={(id) => onChange((current) => ({ ...current, assignedTeamIds: toggleId(current.assignedTeamIds, id) }))}
        emptyMessage="No teams available for the current track."
      />

      <SelectionList
        label={`Assigned Judges (${form.assignedJudgeIds.length})`}
        items={judges.map((judge) => ({ id: judge.id, primary: judge.fullName, secondary: judge.email }))}
        selectedIds={form.assignedJudgeIds}
        onToggle={(id) => onChange((current) => ({ ...current, assignedJudgeIds: toggleId(current.assignedJudgeIds, id) }))}
        emptyMessage="No judge accounts found."
      />
    </div>
  );
}

function DateTimeField({
  id,
  label,
  value,
  min,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="datetime-local" value={value} min={min} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectionList({
  label,
  items,
  selectedIds,
  onToggle,
  emptyMessage,
}: {
  label: string;
  items: Array<{ id: string; primary?: string; secondary?: string | null }>;
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Label>{label}</Label>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border p-3">
        {items.length === 0 && <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
        {items.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-md border p-3">
            <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => onToggle(item.id)} />
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.primary || item.id}</p>
              <p className="text-xs text-muted-foreground">{item.secondary || item.id}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
