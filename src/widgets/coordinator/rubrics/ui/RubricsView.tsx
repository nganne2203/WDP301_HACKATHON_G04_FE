import { FileText, Loader2, MoreVertical, Plus } from 'lucide-react';

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
              <Button disabled={!view.activeCompetition}>
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

            {view.rubrics.map((rubric) => (
              <TableRow key={rubric.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{rubric.title}</p>
                      <p className="text-xs text-muted-foreground">v{rubric.version || 1}</p>
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
                      <DropdownMenuItem onClick={() => view.openCriteriaDialog(rubric)}>
                        Manage criteria
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => view.openEditDialog(rubric)}>
                        Edit rubric
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => view.openDeleteDialog(rubric)}>
                        Delete rubric
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

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
