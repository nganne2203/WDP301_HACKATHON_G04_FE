import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle } from 'lucide-react';

import type { TrackStatus, TrackType } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import { formatTrackType, trackStatusOptions, trackTypeOptions, type TrackFormState } from '../model/track-form';

export function TrackForm({
  form,
  onChange,
}: {
  form: TrackFormState;
  onChange: Dispatch<SetStateAction<TrackFormState>>;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="track-code">Code</Label>
          <Input
            id="track-code"
            value={form.code}
            onChange={(competition) => onChange((current) => ({ ...current, code: competition.target.value }))}
            placeholder="AI-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-name">Name</Label>
          <Input
            id="track-name"
            value={form.name}
            onChange={(competition) => onChange((current) => ({ ...current, name: competition.target.value }))}
            placeholder="AI for Education"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={(value: TrackType) => onChange((current) => ({ ...current, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trackTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatTrackType(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(value: TrackStatus) => onChange((current) => ({ ...current, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trackStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="track-capacity">Max Teams</Label>
          <Input
            id="track-capacity"
            type="number"
            min="2"
            value={form.maxTeams}
            onChange={(competition) => onChange((current) => ({ ...current, maxTeams: competition.target.value }))}
            placeholder="12"
          />
          <p className="text-xs text-muted-foreground">At least 2 teams are required for a competitive round.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="track-description">Description</Label>
        <Textarea
          id="track-description"
          rows={3}
          value={form.description}
          onChange={(competition) => onChange((current) => ({ ...current, description: competition.target.value }))}
          placeholder="Short summary for coordinators and participants."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="track-topic">Topic</Label>
        <Input
          id="track-topic"
          value={form.topic}
          onChange={(competition) => onChange((current) => ({ ...current, topic: competition.target.value }))}
          placeholder="Smart Campus, AI Tutor, Sustainability..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="track-problem-statement">Problem Statement</Label>
        <Textarea
          id="track-problem-statement"
          rows={5}
          value={form.problemStatement}
          onChange={(competition) => onChange((current) => ({ ...current, problemStatement: competition.target.value }))}
          placeholder="Describe the challenge and expected solution scope."
        />
      </div>

    </div>
  );
}

export function TrackMetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}

export function TrackInlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
