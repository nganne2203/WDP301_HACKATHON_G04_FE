import type { Dispatch, SetStateAction } from 'react';

import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import type { CriterionFormState } from '../model/rubric-form';

export function CriterionForm({
  form,
  onChange,
}: {
  form: CriterionFormState;
  onChange: Dispatch<SetStateAction<CriterionFormState>>;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="criterion-name">Name</Label>
        <Input
          id="criterion-name"
          value={form.name}
          onChange={(competition) => onChange((current) => ({ ...current, name: competition.target.value }))}
          placeholder="Technical quality"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="criterion-description">Description</Label>
        <Textarea
          id="criterion-description"
          rows={3}
          value={form.description}
          onChange={(competition) => onChange((current) => ({ ...current, description: competition.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="criterion-max-score">Max Score</Label>
          <Input
            id="criterion-max-score"
            type="number"
            min="0.01"
            step="0.01"
            value={form.maxScore}
            onChange={(competition) => onChange((current) => ({ ...current, maxScore: competition.target.value }))}
            onBlur={() => onChange((current) => {
              const value = Number(current.maxScore);
              return { ...current, maxScore: Number.isFinite(value) && value > 0 ? value.toFixed(2) : current.maxScore };
            })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criterion-weight">Weight</Label>
          <Input
            id="criterion-weight"
            type="number"
            min="0.01"
            step="0.01"
            value={form.weight}
            onChange={(competition) => onChange((current) => ({ ...current, weight: competition.target.value }))}
            onBlur={() => onChange((current) => {
              const value = Number(current.weight);
              return { ...current, weight: Number.isFinite(value) && value > 0 ? value.toFixed(2) : current.weight };
            })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criterion-order">Order</Label>
          <Input
            id="criterion-order"
            type="number"
            min="1"
            value={form.order}
            onChange={(competition) => onChange((current) => ({ ...current, order: competition.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="criterion-ai-instruction">AI Instruction</Label>
        <Textarea
          id="criterion-ai-instruction"
          rows={3}
          value={form.aiInstruction}
          onChange={(competition) => onChange((current) => ({ ...current, aiInstruction: competition.target.value }))}
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={form.judgeOnly} onCheckedChange={(checked) => onChange((current) => ({ ...current, judgeOnly: checked === true }))} />
        Judge-only criterion
      </label>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={form.aiSupportForAudit} onCheckedChange={(checked) => onChange((current) => ({ ...current, aiSupportForAudit: checked === true }))} />
        Enable AI audit support
      </label>
    </div>
  );
}
