import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle } from 'lucide-react';

import type { TimelineActivityType, TimelineStatus } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import { formatTimelineType, timelineStatusOptions, timelineTypeOptions, type TimelineFormState } from '../model/timeline-form';

export function TimelineForm({
  form,
  onChange,
}: {
  form: TimelineFormState;
  onChange: Dispatch<SetStateAction<TimelineFormState>>;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="timeline-title">Title</Label>
        <Input
          id="timeline-title"
          value={form.title}
          onChange={(competition) => onChange((current) => ({ ...current, title: competition.target.value }))}
          placeholder="Opening ceremony"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={form.activityType}
            onValueChange={(value: TimelineActivityType) => onChange((current) => ({ ...current, activityType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timelineTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {formatTimelineType(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value: TimelineStatus) => onChange((current) => ({ ...current, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timelineStatusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="timeline-start">Start Time</Label>
          <Input
            id="timeline-start"
            type="datetime-local"
            value={form.startTime}
            onChange={(competition) => onChange((current) => ({ ...current, startTime: competition.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeline-end">End Time</Label>
          <Input
            id="timeline-end"
            type="datetime-local"
            value={form.endTime}
            onChange={(competition) => onChange((current) => ({ ...current, endTime: competition.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timeline-description">Description</Label>
        <Textarea
          id="timeline-description"
          rows={4}
          value={form.description}
          onChange={(competition) => onChange((current) => ({ ...current, description: competition.target.value }))}
          placeholder="Optional agenda details, logistics, or reminders."
        />
      </div>
    </div>
  );
}

export function TimelineMetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}

export function TimelineInlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
