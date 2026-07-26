import type { Dispatch, SetStateAction } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import type { Criterion, Rubric } from '@/shared/api/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

import {
  createCriterionForm,
  formatScore,
  mapCriterionToForm,
  roundScore,
  type CriterionFormState,
} from '../model/rubric-form';
import { CriterionForm } from './CriterionForm';

export function RubricCriteriaDialog({
  open,
  onOpenChange,
  selectedRubric,
  editingCriterion,
  setEditingCriterion,
  criterionForm,
  setCriterionForm,
  createPending,
  updatePending,
  deletePending,
  onCreateCriterion,
  onUpdateCriterion,
  onDeleteCriterion,
  readOnly = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRubric: Rubric | null;
  editingCriterion: Criterion | null;
  setEditingCriterion: Dispatch<SetStateAction<Criterion | null>>;
  criterionForm: CriterionFormState;
  setCriterionForm: Dispatch<SetStateAction<CriterionFormState>>;
  createPending: boolean;
  updatePending: boolean;
  deletePending: boolean;
  onCreateCriterion: (rubricId: string, form: CriterionFormState) => void;
  onUpdateCriterion: (rubricId: string, criterionId: string, form: CriterionFormState) => void;
  onDeleteCriterion: (rubricId: string, criterionId: string) => void;
  readOnly?: boolean;
}) {
  const scale = Number(selectedRubric?.totalScore || 100);
  const currentWeightTotal = roundScore((selectedRubric?.criteria || []).reduce((sum, criterion) => sum + Number(criterion.weight || 0), 0));
  const formWeight = Number(criterionForm.weight || 0);
  const editingWeight = Number(editingCriterion?.weight || 0);
  const nextWeightTotal = roundScore(currentWeightTotal - editingWeight + (Number.isFinite(formWeight) ? formWeight : 0));
  const criterionNumbersValid = Number.isInteger(formWeight) && formWeight > 0;
  const exceedsScale = nextWeightTotal > scale;
  const matchesScale = currentWeightTotal === scale;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] !w-[min(96vw,1280px)] !max-w-[min(96vw,1280px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedRubric?.title || 'Rubric Criteria'}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'This competition has been completed, so criteria are available for viewing only.'
              : 'Maintain detailed scoring criteria for judges.'}
          </DialogDescription>
        </DialogHeader>
        {selectedRubric && (
          <div className={readOnly ? 'grid gap-6' : 'grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.95fr)]'}>
            <div className="space-y-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Assigned Weight</p>
                    <p className="text-xs text-muted-foreground">All criterion weights must equal the total weight before this rubric can leave Draft.</p>
                  </div>
                  <Badge variant={matchesScale ? 'default' : 'outline'}>
                    {formatScore(currentWeightTotal)} / {formatScore(scale)}
                  </Badge>
                </div>
              </div>
              {selectedRubric.criteria.length === 0 && (
                <p className="text-sm text-muted-foreground">No criteria yet. Add one from the form on the right.</p>
              )}
              {selectedRubric.criteria.map((criterion) => (
                <div key={criterion.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{criterion.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Coefficient {formatScore(criterion.weight)} · Order {criterion.order || '-'}
                      </p>
                    </div>
                    {!readOnly && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCriterion(criterion);
                          setCriterionForm(mapCriterionToForm(criterion));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletePending}
                        onClick={() => onDeleteCriterion(selectedRubric.id, criterion.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    )}
                  </div>
                  {criterion.description && <p className="text-sm text-muted-foreground">{criterion.description}</p>}
                  {criterion.aiInstruction && (
                    <div className="rounded-md bg-slate-50 p-3 text-xs text-muted-foreground">
                      {criterion.aiInstruction}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={criterion.judgeOnly ? 'secondary' : 'outline'}>
                      {criterion.judgeOnly ? 'Judge only' : 'Visible'}
                    </Badge>
                    <Badge variant={criterion.aiSupportForAudit ? 'default' : 'outline'}>
                      {criterion.aiSupportForAudit ? 'AI audit enabled' : 'AI audit off'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {!readOnly && (
            <div className="min-w-0 space-y-4 rounded-lg border p-5 lg:min-w-[420px]">
              <div>
                <h3 className="font-medium">{editingCriterion ? 'Edit Criterion' : 'Add Criterion'}</h3>
                <p className="text-xs text-muted-foreground">
                  {editingCriterion ? 'Update the selected criterion.' : 'Create a new criterion for this rubric.'}
                </p>
              </div>
              <CriterionForm form={criterionForm} onChange={setCriterionForm} />
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Assigned Weight after saving: {formatScore(nextWeightTotal)} / {formatScore(scale)}
                {exceedsScale ? ' - exceeds the total weight.' : ''}
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!selectedRubric) return;
                    if (editingCriterion) {
                      onUpdateCriterion(selectedRubric.id, editingCriterion.id, criterionForm);
                      return;
                    }

                    onCreateCriterion(selectedRubric.id, criterionForm);
                  }}
                  disabled={
                    createPending ||
                    updatePending ||
                    !criterionForm.name.trim() ||
                    !criterionNumbersValid ||
                    exceedsScale
                  }
                >
                  {(createPending || updatePending) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingCriterion ? 'Save Criterion' : 'Add Criterion'}
                </Button>
                {editingCriterion && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingCriterion(null);
                      setCriterionForm(createCriterionForm());
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
