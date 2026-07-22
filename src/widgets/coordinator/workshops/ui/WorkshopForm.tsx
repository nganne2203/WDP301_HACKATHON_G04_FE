import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle } from 'lucide-react';

import type { TimelineActivity, User, WorkshopStatus } from '@/shared/api/types';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import { workshopPresenterUserLabel, workshopStatusOptions, type WorkshopFormState } from '../model/workshop-form';

export function WorkshopForm({
  form,
  onChange,
  presenters,
  presentersLoading,
  timelines,
}: {
  form: WorkshopFormState;
  onChange: Dispatch<SetStateAction<WorkshopFormState>>;
  presenters: User[];
  presentersLoading?: boolean;
  timelines: TimelineActivity[];
}) {

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="workshop-title">Title</Label>
          <Input
            id="workshop-title"
            value={form.title}
            onChange={(competition) => onChange((current) => ({ ...current, title: competition.target.value }))}
            placeholder="GitHub workflow clinic"
          />
        </div>
        <div className="space-y-2">
          <Label>Timeline Item</Label>
          <Select
            value={form.timelineActivityId}
            onValueChange={(value) => onChange((current) => ({ ...current, timelineActivityId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional timeline reference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No linked timeline item</SelectItem>
              {timelines.map((timeline) => (
                <SelectItem key={timeline.id} value={timeline.id}>
                  {timeline.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="workshop-start">Start Time</Label>
          <Input
            id="workshop-start"
            type="datetime-local"
            value={form.startTime}
            onChange={(competition) => onChange((current) => ({ ...current, startTime: competition.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workshop-end">End Time</Label>
          <Input
            id="workshop-end"
            type="datetime-local"
            value={form.endTime}
            onChange={(competition) => onChange((current) => ({ ...current, endTime: competition.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Presenter</Label>
          <Select
            value={form.presenterId || 'none'}
            onValueChange={(value) => onChange((current) => ({ ...current, presenterId: value === 'none' ? '' : value }))}
            disabled={presentersLoading}
          >
            <SelectTrigger id="workshop-presenter-id">
              <SelectValue placeholder={presentersLoading ? 'Loading presenters...' : 'Select presenter'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No presenter assigned</SelectItem>
              {presenters.map((presenter) => (
                <SelectItem key={presenter.id} value={presenter.id}>
                  <span className="min-w-0 truncate">{workshopPresenterUserLabel(presenter)}</span>
                  <span className="min-w-0 truncate text-xs text-muted-foreground">{presenter.email}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!presentersLoading && presenters.length === 0 && (
            <p className="text-xs text-muted-foreground">No eligible presenter accounts found.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(value: WorkshopStatus) => onChange((current) => ({ ...current, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workshopStatusOptions.map((option) => (
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
          <Label htmlFor="speaker-name">Speaker Name</Label>
          <Input
            id="speaker-name"
            value={form.speakerName}
            onChange={(competition) => onChange((current) => ({ ...current, speakerName: competition.target.value }))}
            placeholder="Internal or guest speaker name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="speaker-title">Speaker Title</Label>
          <Input
            id="speaker-title"
            value={form.speakerTitle}
            onChange={(competition) => onChange((current) => ({ ...current, speakerTitle: competition.target.value }))}
            placeholder="Mentor, Engineer, Lecturer..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="speaker-email">Speaker Email</Label>
          <Input
            id="speaker-email"
            type="email"
            value={form.speakerEmail}
            onChange={(competition) => onChange((current) => ({ ...current, speakerEmail: competition.target.value }))}
            placeholder="speaker@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workshop-link">Meet Link</Label>
          <Input
            id="workshop-link"
            value={form.meetLink}
            onChange={(competition) => onChange((current) => ({ ...current, meetLink: competition.target.value }))}
            placeholder="https://meet.google.com/..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workshop-description">Description</Label>
        <Textarea
          id="workshop-description"
          rows={3}
          value={form.description}
          onChange={(competition) => onChange((current) => ({ ...current, description: competition.target.value }))}
          placeholder="Describe the workshop and expected attendee outcome."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="speaker-bio">Speaker Bio</Label>
        <Textarea
          id="speaker-bio"
          rows={3}
          value={form.speakerBio}
          onChange={(competition) => onChange((current) => ({ ...current, speakerBio: competition.target.value }))}
          placeholder="Short speaker biography for competition staff."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="workshop-questionnaire">Questionnaire</Label>
        <Textarea
          id="workshop-questionnaire"
          rows={4}
          value={form.questionnaire}
          onChange={(competition) => onChange((current) => ({ ...current, questionnaire: competition.target.value }))}
          placeholder="One question per line. These will be sent as a string array."
        />
      </div>
    </div>
  );
}

export function WorkshopMetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}

export function WorkshopInlineError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
