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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="criterion-weight">Weight</Label>
          <Input
            id="criterion-weight"
            type="number"
            min="1"
            step="1"
            value={form.weight}
            onChange={(competition) => onChange((current) => ({ ...current, weight: competition.target.value }))}
            onBlur={() => onChange((current) => {
              const value = Number(current.weight);
              return { ...current, weight: Number.isInteger(value) && value > 0 ? String(value) : current.weight };
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
          disabled={!form.aiSupportForAudit}
          placeholder={form.aiSupportForAudit ? 'Optional guidance for AI audit' : 'Enable AI audit support to add an instruction'}
          onChange={(competition) => onChange((current) => ({ ...current, aiInstruction: competition.target.value }))}
        />
      </div>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={form.judgeOnly} onCheckedChange={(checked) => onChange((current) => ({ ...current, judgeOnly: checked === true }))} />
        Judge-only criterion
      </label>
      <label className="flex items-center gap-3 text-sm">
        <Checkbox checked={form.aiSupportForAudit} onCheckedChange={(checked) => onChange((current) => {
          const enabled = checked === true;
          return { ...current, aiSupportForAudit: enabled, aiInstruction: enabled ? current.aiInstruction : '' };
        })} />
        Enable AI audit support
      </label>
    </div>
  );
}
