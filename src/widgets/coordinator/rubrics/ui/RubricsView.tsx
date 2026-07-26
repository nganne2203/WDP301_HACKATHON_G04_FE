import { useState } from 'react';
import { FileText, Loader2, MoreVertical, Plus } from 'lucide-react';
import type { Rubric } from '@/shared/api/types';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

import { RubricCriteriaDialog } from './RubricCriteriaDialog';
import { RubricForm } from './RubricForm';
import { useRubricsView } from '../model/useRubricsView';
import { formatScore } from '../model/rubric-form';

export function Rubrics() {
  const view = useRubricsView();
  const [detailsRubric, setDetailsRubric] = useState<Rubric | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Rubrics Management</h1>
          <p className="text-sm text-muted-foreground">
            Create scoring rubrics, attach them to rounds, and manage weighted criteria.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="w-full sm:w-72">
            <Select value={view.selectedRoundFilter} onValueChange={view.setSelectedRoundFilter} disabled={!view.activeCompetition}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All rounds</SelectItem>
                {view.rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={view.createOpen} onOpenChange={view.openCreateDialog}>
            <DialogTrigger asChild>
              <Button
                disabled={!view.activeCompetition || view.rubricsReadOnly}
                title={view.rubricsReadOnly ? 'Rubrics are read-only after the competition is completed.' : undefined}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Rubric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Rubric</DialogTitle>
                <DialogDescription>Create a reusable rubric for {view.activeCompetition?.title || 'the selected competition'}.</DialogDescription>
              </DialogHeader>
              <RubricForm form={view.createForm} onChange={view.setCreateForm} rounds={view.rounds} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => view.openCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={view.submitCreate} disabled={view.createMutation.isPending || !view.createForm.title.trim()}>
                  {view.createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Rubric'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(view.eventsQuery.error || view.roundsQuery.error || view.rubricsQuery.error) && (
        <Alert>
          <AlertTitle>Could not load rubric data</AlertTitle>
          <AlertDescription>
            {view.getRubricErrorMessage(view.eventsQuery.error || view.roundsQuery.error || view.rubricsQuery.error)}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rubric</TableHead>
              <TableHead>Round</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scoring coefficient</TableHead>
              <TableHead>Assigned Weight</TableHead>
              <TableHead>Total Weight</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(view.eventsQuery.isLoading || view.rubricsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading rubrics...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!view.eventsQuery.isLoading && !view.rubricsQuery.isLoading && view.rubrics.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No rubrics found for this filter.
                </TableCell>
              </TableRow>
            )}

            {view.rubrics.map((rubric) => {
              const rubricReadOnly = view.isRubricReadOnly(rubric);

              return (
                <TableRow key={rubric.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{rubric.title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{rubric.round?.name || 'Reusable'}</TableCell>
                  <TableCell>
                    <Badge variant={rubric.status === 'ACTIVE' ? 'default' : rubric.status === 'ARCHIVED' ? 'secondary' : 'outline'}>
                      {rubric.status || 'DRAFT'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatScore(rubric.criterionMaxScore)}</TableCell>
                  <TableCell>
                    <span className={(rubric.criteriaWeightTotal ?? 0) === (rubric.totalScore ?? 100) ? '' : 'text-amber-600'}>
                      {formatScore(rubric.criteriaWeightTotal)}
                    </span>
                  </TableCell>
                  <TableCell>{formatScore(rubric.totalScore)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailsRubric(rubric)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => view.openCriteriaDialog(rubric)}>
                          {rubricReadOnly ? 'View criteria' : 'Manage criteria'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={rubricReadOnly} onClick={() => view.openEditDialog(rubric)}>
                          Edit rubric
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={rubricReadOnly} className="text-destructive" onClick={() => view.openDeleteDialog(rubric)}>
                          Delete rubric
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={Boolean(detailsRubric)} onOpenChange={(open) => { if (!open) setDetailsRubric(null); }}>
        <DialogContent className="max-h-[85vh] !w-[min(48rem,calc(100vw-2rem))] !max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsRubric?.title || 'Rubric details'}</DialogTitle>
            <DialogDescription>Scoring configuration and criteria included in this rubric.</DialogDescription>
          </DialogHeader>
          {detailsRubric && (
            <div className="space-y-6 text-sm">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Competition" value={detailsRubric.competition?.title || view.activeCompetition?.title || '-'} />
                <DetailField label="Round" value={detailsRubric.round?.name || 'Reusable'} />
                <DetailField label="Status" value={detailsRubric.status || 'DRAFT'} />
                <DetailField label="Scoring Coefficient" value={formatScore(detailsRubric.criterionMaxScore)} />
                <DetailField label="Assigned Weight" value={formatScore(detailsRubric.criteriaWeightTotal)} />
                <DetailField label="Total Weight" value={formatScore(detailsRubric.totalScore)} />
                <DetailField label="Created At" value={formatDetailDate(detailsRubric.createdAt)} />
                <DetailField label="Updated At" value={formatDetailDate(detailsRubric.updatedAt)} />
              </div>
              <DetailField label="Description" value={detailsRubric.description || 'No description'} multiline />
              <div>
                <p className="font-medium">Criteria ({detailsRubric.criteria.length})</p>
                {detailsRubric.criteria.length ? (
                  <div className="mt-3 space-y-3">
                    {[...detailsRubric.criteria].sort((a, b) => (a.order || 0) - (b.order || 0)).map((criterion) => (
                      <div className="rounded-lg border p-4" key={criterion.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{criterion.order ? `${criterion.order}. ` : ''}{criterion.name}</p>
                            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{criterion.description || 'No description'}</p>
                          </div>
                          <div className="text-right text-xs">
                            <p>Weight: <span className="font-medium">{formatScore(criterion.weight)}</span></p>
                          </div>
                        </div>
                        {(criterion.judgeOnly || criterion.aiSupportForAudit) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {criterion.judgeOnly && <Badge variant="outline">Judge only</Badge>}
                            {criterion.aiSupportForAudit && <Badge variant="outline">AI audit support</Badge>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-2 text-muted-foreground">No criteria configured.</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Rubric</DialogTitle>
            <DialogDescription>Update the rubric details. Scoring criteria are managed separately.</DialogDescription>
          </DialogHeader>
          <RubricForm form={view.editForm} onChange={view.setEditForm} rounds={view.rounds} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => view.setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={view.submitEdit} disabled={view.updateMutation.isPending || !view.editForm.title.trim()}>
              {view.updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RubricCriteriaDialog
        open={view.criteriaOpen}
        onOpenChange={view.setCriteriaOpen}
        selectedRubric={view.selectedRubric}
        editingCriterion={view.editingCriterion}
        setEditingCriterion={view.setEditingCriterion}
        criterionForm={view.criterionForm}
        setCriterionForm={view.setCriterionForm}
        createPending={view.createCriterionMutation.isPending}
        updatePending={view.updateCriterionMutation.isPending}
        deletePending={view.deleteCriterionMutation.isPending}
        onCreateCriterion={view.submitCreateCriterion}
        onUpdateCriterion={view.submitUpdateCriterion}
        onDeleteCriterion={view.submitDeleteCriterion}
        readOnly={view.isRubricReadOnly(view.selectedRubric)}
      />

      <AlertDialog open={view.deleteOpen} onOpenChange={view.setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete rubric</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{view.selectedRubric?.title}"? It will no longer be available for scoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={view.submitDelete}>
              {view.deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailField({ label, multiline, value }: { label: string; multiline?: boolean; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={multiline ? 'mt-1 whitespace-pre-wrap break-words' : 'mt-1 break-words font-medium'}>{value}</p>
    </div>
  );
}

function formatDetailDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}
