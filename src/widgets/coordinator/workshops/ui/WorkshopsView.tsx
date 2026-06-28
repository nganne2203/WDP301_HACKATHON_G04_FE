import { Loader2, MessageSquare, MoreVertical, Plus, Presentation, RefreshCw, Send, ThumbsUp } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import type { WorkshopQuestion } from '@/shared/api/types';
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
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { ListPagination } from '@/shared/ui/list-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  createEmptyWorkshopForm,
  formatDateTime,
  workshopPresenterLabel,
} from '../model/workshop-form';
import { useWorkshopsView } from '../model/useWorkshopsView';
import { WorkshopForm, WorkshopInlineError, WorkshopMetricCard } from './WorkshopForm';

export function Workshops() {
  const view = useWorkshopsView();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Workshop Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage seminars, speakers, questionnaire prompts, and workshop links from the FE.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="w-full sm:w-80">
            <Select value={view.activeEvent?.id || ''} onValueChange={view.setSelectedEventId} disabled={view.eventsQuery.isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {view.events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog
            open={view.createOpen}
            onOpenChange={(open) => {
              view.setCreateOpen(open);
              if (!open) view.setCreateForm(createEmptyWorkshopForm());
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={!view.activeEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Workshop
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Workshop</DialogTitle>
                <DialogDescription>Schedule a workshop for {view.activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              <WorkshopForm form={view.createForm} onChange={view.setCreateForm} timelines={view.workshopTimelines} presenters={view.presenters} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => view.setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={view.handleCreate} disabled={view.createMutation.isPending}>
                  {view.createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Workshop'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <WorkshopMetricCard label="Total Workshops" value={String(view.workshops.length)} helper="Scheduled in selected event" />
        <WorkshopMetricCard label="Live Now" value={String(view.liveCount)} helper="Sessions currently active" />
        <WorkshopMetricCard label="Completed" value={String(view.completedCount)} helper="Finished workshops" />
      </div>

      {view.eventsQuery.error && (
        <WorkshopInlineError message={view.eventsQuery.error instanceof ApiError ? view.eventsQuery.error.firstError : 'Failed to load events'} />
      )}

      {view.workshopsQuery.error && (
        <WorkshopInlineError message={view.workshopsQuery.error instanceof ApiError ? view.workshopsQuery.error.firstError : 'Failed to load workshops'} />
      )}

      {view.workshopTimelinesQuery.error && (
        <WorkshopInlineError message={view.workshopTimelinesQuery.error instanceof ApiError ? view.workshopTimelinesQuery.error.firstError : 'Failed to load workshop timelines'} />
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workshop</TableHead>
              <TableHead>Presenter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Workshop Questionnaire</TableHead>
              <TableHead>Speaker Q&A</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(view.eventsQuery.isLoading || view.workshopsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading workshops...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!view.eventsQuery.isLoading && !view.workshopsQuery.isLoading && view.workshops.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No workshops found for this event.
                </TableCell>
              </TableRow>
            )}

            {view.workshops.map((workshop) => (
              <TableRow key={workshop.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                      <Presentation className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{workshop.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {workshop.meetLink || workshop.description || 'No meeting link or description yet'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{workshopPresenterLabel(workshop)}</TableCell>
                <TableCell>{workshop.status}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{formatDateTime(workshop.startTime)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(workshop.endTime)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {workshop.questionnaire && workshop.questionnaire.length > 0 ? (
                    <ul className="space-y-1">
                      {workshop.questionnaire.map((q, i) => (
                        <li key={i} className="text-sm text-muted-foreground leading-snug">
                          {i + 1}. {q}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No questionnaire prepared</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => view.openQuestionsDialog(workshop)}>
                    <MessageSquare className="h-4 w-4" />
                    View questions
                  </Button>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => view.openQuestionsDialog(workshop)}>
                        View speaker questions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => view.openEditDialog(workshop)}>
                        Edit workshop
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          view.setSelectedWorkshop(workshop);
                          view.setDeleteOpen(true);
                        }}
                      >
                        Delete workshop
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ListPagination page={view.page} pagination={view.pagination} onPageChange={view.setPage} />
      </Card>

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>Update workshop speaker info and scheduling fields to match the backend.</DialogDescription>
          </DialogHeader>
          <WorkshopForm form={view.editForm} onChange={view.setEditForm} timelines={view.workshopTimelines} presenters={view.presenters} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => view.setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={view.handleUpdate} disabled={view.updateMutation.isPending}>
              {view.updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={view.deleteOpen} onOpenChange={view.setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workshop</AlertDialogTitle>
            <AlertDialogDescription>
              Delete "{view.selectedWorkshop?.title}" and its related workshop interactions?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => view.selectedWorkshop && view.deleteMutation.mutate(view.selectedWorkshop.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {view.deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={view.questionsOpen} onOpenChange={view.setQuestionsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Questions for Speaker</DialogTitle>
            <DialogDescription>
              Participant-submitted questions for {view.selectedQuestionsWorkshop?.title || 'this workshop'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workshop Questionnaire</p>
              {view.selectedQuestionsWorkshop?.questionnaire?.length ? (
                <ul className="mt-2 space-y-1">
                  {view.selectedQuestionsWorkshop.questionnaire.map((question, index) => (
                    <li key={`${question}-${index}`} className="text-sm text-muted-foreground">
                      {index + 1}. {question}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No questionnaire has been prepared for this workshop.</p>
              )}
            </div>

            <div className="rounded-md border p-4">
              <p className="text-sm font-semibold">Submit a Question</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This creates a participant question for the speaker, not a workshop questionnaire item.
              </p>
              <Textarea
                className="mt-3 min-h-24"
                disabled={!view.canCreateWorkshopQuestions || !view.canSubmitWorkshopQuestion || view.createQuestionMutation.isPending}
                maxLength={1000}
                onChange={(event) => view.setQuestionContent(event.target.value)}
                placeholder="Ask the speaker a question"
                value={view.questionContent}
              />
              {!view.canCreateWorkshopQuestions && (
                <p className="mt-2 text-xs text-muted-foreground">You do not have permission to submit workshop questions.</p>
              )}
              {view.canCreateWorkshopQuestions && !view.canSubmitWorkshopQuestion && (
                <p className="mt-2 text-xs text-muted-foreground">Questions can be submitted before or during the workshop.</p>
              )}
              <Button
                className="mt-3"
                disabled={
                  view.questionContent.trim().length < 2 ||
                  !view.canCreateWorkshopQuestions ||
                  !view.canSubmitWorkshopQuestion ||
                  view.createQuestionMutation.isPending
                }
                onClick={view.handleCreateQuestion}
              >
                {view.createQuestionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit question
              </Button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Participant Questions</p>
                <p className="text-xs text-muted-foreground">Questions submitted separately for the speaker.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => view.workshopQuestionsQuery.refetch()} disabled={view.workshopQuestionsQuery.isFetching}>
                {view.workshopQuestionsQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>

            {view.workshopQuestionsQuery.isLoading && (
              <div className="flex items-center justify-center gap-2 rounded-md border py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading participant questions...
              </div>
            )}

            {view.workshopQuestionsQuery.error && (
              <WorkshopInlineError
                message={view.workshopQuestionsQuery.error instanceof ApiError ? view.workshopQuestionsQuery.error.firstError : 'Failed to load participant questions'}
              />
            )}

            {!view.workshopQuestionsQuery.isLoading && !view.workshopQuestionsQuery.error && view.workshopQuestions.length === 0 && (
              <div className="rounded-md border py-10 text-center text-sm text-muted-foreground">
                No participant questions have been submitted yet.
              </div>
            )}

            {!view.workshopQuestionsQuery.isLoading && !view.workshopQuestionsQuery.error && view.workshopQuestions.length > 0 && (
              <div className="space-y-3">
                {view.workshopQuestions.map((question) => (
                  <WorkshopQuestionItem
                    key={question.id}
                    canVote={view.canVoteWorkshopQuestions}
                    isVoting={view.voteQuestionMutation.isPending && view.voteQuestionMutation.variables === question.id}
                    onVote={() => view.voteQuestionMutation.mutate(question.id)}
                    question={question}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkshopQuestionItem({
  canVote,
  isVoting,
  onVote,
  question,
}: {
  canVote: boolean;
  isVoting: boolean;
  onVote: () => void;
  question: WorkshopQuestion;
}) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm font-medium leading-relaxed">{question.content}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{question.author?.fullName || question.author?.email || 'Anonymous participant'}</span>
        <span>{formatDateTime(question.createdAt)}</span>
      </div>
      <Button className="mt-3" variant="outline" size="sm" onClick={onVote} disabled={!canVote || isVoting}>
        {isVoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
        {question.voteCount} votes
      </Button>
      {!canVote && (
        <p className="mt-2 text-xs text-muted-foreground">You do not have permission to vote workshop questions.</p>
      )}
    </div>
  );
}
