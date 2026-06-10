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
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
          placeholder="Technical quality"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="criterion-description">Description</Label>
        <Textarea
          id="criterion-description"
          rows={3}
          value={form.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="criterion-max-score">Max Score</Label>
          <Input
            id="criterion-max-score"
            type="number"
            min="0"
            value={form.maxScore}
            onChange={(event) => onChange((current) => ({ ...current, maxScore: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criterion-weight">Weight</Label>
          <Input
            id="criterion-weight"
            type="number"
            min="0"
            value={form.weight}
            onChange={(event) => onChange((current) => ({ ...current, weight: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="criterion-order">Order</Label>
          <Input
            id="criterion-order"
            type="number"
            min="1"
            value={form.order}
            onChange={(event) => onChange((current) => ({ ...current, order: event.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="criterion-ai-instruction">AI Instruction</Label>
        <Textarea
          id="criterion-ai-instruction"
          rows={3}
          value={form.aiInstruction}
          onChange={(event) => onChange((current) => ({ ...current, aiInstruction: event.target.value }))}
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
