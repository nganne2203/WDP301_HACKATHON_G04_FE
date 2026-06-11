import type { UseFormReturn } from 'react-hook-form';

import { eventStatusOptions, type EventFormValues } from '@/features/event-management/model/event-form';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

export function EventForm({
  form,
  onSubmit,
  pending,
  submitLabel,
  pendingLabel,
  onCancel,
  prefix,
}: {
  form: UseFormReturn<EventFormValues>;
  onSubmit: (data: EventFormValues) => void;
  pending: boolean;
  submitLabel: string;
  pendingLabel: string;
  onCancel: () => void;
  prefix: string;
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-title`}>Event Title</Label>
          <Input id={`${prefix}-title`} placeholder="SEAL Hackathon 2026" {...form.register('title')} />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-semester`}>Semester</Label>
          <Input id={`${prefix}-semester`} placeholder="2026A" {...form.register('semester')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-description`}>Description</Label>
        <Textarea
          id={`${prefix}-description`}
          placeholder="Enter event description..."
          rows={3}
          {...form.register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-startDate`}>Start Date</Label>
          <Input id={`${prefix}-startDate`} type="date" {...form.register('startDate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-endDate`}>End Date</Label>
          <Input id={`${prefix}-endDate`} type="date" {...form.register('endDate')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-status`}>Status</Label>
        <Select value={form.watch('status') || 'DRAFT'} onValueChange={(value) => form.setValue('status', value)}>
          <SelectTrigger id={`${prefix}-status`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eventStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
