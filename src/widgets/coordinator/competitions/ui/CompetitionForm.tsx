import type { UseFormReturn } from 'react-hook-form';

import {
  finalistSelectionModeOptions,
  getTodayDateInputValue,
  type CompetitionFormValues,
} from '@/features/competition-management/model/competition-form';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';

export function CompetitionForm({
  form,
  onSubmit,
  pending,
  submitLabel,
  pendingLabel,
  onCancel,
  prefix,
  allowPastDates = false,
}: {
  form: UseFormReturn<CompetitionFormValues>;
  onSubmit: (data: CompetitionFormValues) => void;
  pending: boolean;
  submitLabel: string;
  pendingLabel: string;
  onCancel: () => void;
  prefix: string;
  allowPastDates?: boolean;
}) {
  const today = getTodayDateInputValue();
  const startDate = form.watch('startDate');
  const boardCount = form.watch('boardCount');
  const finalistsPerBoard = form.watch('finalistsPerBoard');
  const finalistCount = form.watch('finalistCount');
  const finalistSelectionMode = form.watch('finalistSelectionMode') || 'FIXED_PER_BOARD';
  const minStartDate = allowPastDates ? undefined : today;
  const minEndDate = startDate || minStartDate;
  const expectedFixedFinalists = boardCount && finalistsPerBoard ? Number(boardCount) * Number(finalistsPerBoard) : null;
  const selectedMode = finalistSelectionModeOptions.find((option) => option.value === finalistSelectionMode);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-title`}>Competition Title</Label>
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
          placeholder="Enter competition description..."
          rows={3}
          {...form.register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-startDate`}>Start Date</Label>
          <Input id={`${prefix}-startDate`} type="date" min={minStartDate} {...form.register('startDate')} />
          {form.formState.errors.startDate && (
            <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-endDate`}>End Date</Label>
          <Input id={`${prefix}-endDate`} type="date" min={minEndDate} {...form.register('endDate')} />
          {form.formState.errors.endDate && (
            <p className="text-sm text-red-600">{form.formState.errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
        <div>
          <h3 className="font-semibold">Advancement Rules</h3>
          <p className="text-sm text-muted-foreground">
            Configure how teams are selected for the next round after official judge scores are generated.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-boardCount`}>Judging boards</Label>
            <Input
              id={`${prefix}-boardCount`}
              type="number"
              min={1}
              placeholder="3"
              {...form.register('boardCount', { valueAsNumber: true })}
            />
            {form.formState.errors.boardCount && (
              <p className="text-sm text-red-600">{form.formState.errors.boardCount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-maxTeamsPerBoard`}>Max teams per board</Label>
            <Input
              id={`${prefix}-maxTeamsPerBoard`}
              type="number"
              min={1}
              placeholder="10"
              {...form.register('maxTeamsPerBoard', { valueAsNumber: true })}
            />
            {form.formState.errors.maxTeamsPerBoard && (
              <p className="text-sm text-red-600">{form.formState.errors.maxTeamsPerBoard.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}-finalistSelectionMode`}>Selection mode</Label>
          <Select
            value={finalistSelectionMode}
            onValueChange={(value) => form.setValue('finalistSelectionMode', value as CompetitionFormValues['finalistSelectionMode'], { shouldValidate: true })}
          >
            <SelectTrigger id={`${prefix}-finalistSelectionMode`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {finalistSelectionModeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMode && <p className="text-xs text-muted-foreground">{selectedMode.description}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-finalistsPerBoard`}>Teams advancing per board</Label>
            <Input
              id={`${prefix}-finalistsPerBoard`}
              type="number"
              min={1}
              placeholder="2"
              {...form.register('finalistsPerBoard', { valueAsNumber: true })}
            />
            {form.formState.errors.finalistsPerBoard && (
              <p className="text-sm text-red-600">{form.formState.errors.finalistsPerBoard.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-finalistCount`}>Total advancing teams</Label>
            <Input
              id={`${prefix}-finalistCount`}
              type="number"
              min={1}
              placeholder={expectedFixedFinalists ? String(expectedFixedFinalists) : '6'}
              {...form.register('finalistCount', { valueAsNumber: true })}
            />
            {form.formState.errors.finalistCount && (
              <p className="text-sm text-red-600">{form.formState.errors.finalistCount.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-md border bg-background p-3">
          <div>
            <Label htmlFor={`${prefix}-fillRemainingFinalistsByOverallScore`}>Fill empty slots by overall score</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Useful when a board has fewer eligible teams than its quota.
            </p>
          </div>
          <Switch
            id={`${prefix}-fillRemainingFinalistsByOverallScore`}
            checked={Boolean(form.watch('fillRemainingFinalistsByOverallScore'))}
            onCheckedChange={(checked) => form.setValue('fillRemainingFinalistsByOverallScore', checked)}
          />
        </div>

        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
          Example: 30 teams, 3 boards, 10 teams per board, 2 teams advancing per board means 6 teams advance.
          {expectedFixedFinalists && finalistSelectionMode === 'FIXED_PER_BOARD' && (
            <span className="block mt-1 font-medium">
              Current fixed-per-board total should be {expectedFixedFinalists} team(s).
              {finalistCount && finalistCount !== expectedFixedFinalists ? ' Please adjust Total advancing teams.' : ''}
            </span>
          )}
        </div>
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
