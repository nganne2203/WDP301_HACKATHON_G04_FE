import { Eye, Loader2, MessageSquare, MoreVertical, Plus, Presentation, RefreshCw, Send, Star, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

import { ApiError } from '@/shared/api/client';
import type { Workshop, WorkshopFeedback, WorkshopQuestion, WorkshopRating } from '@/shared/api/types';
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
  const [detailsWorkshop, setDetailsWorkshop] = useState<Workshop | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Workshop Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage workshops, speakers, questions, and meeting links.
          </p>
        </div>
        <div className="flex shrink-0">
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
            <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
              <div className="flex-shrink-0 px-6 pt-6">
              <DialogHeader>
                <DialogTitle>Create Workshop</DialogTitle>
                <DialogDescription>Schedule a workshop for {view.activeEvent?.title || 'the selected event'}.</DialogDescription>
              </DialogHeader>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6">
              <WorkshopForm
                form={view.createForm}
                onChange={view.setCreateForm}
                presenters={view.presenterUsers}
                presentersLoading={view.presenterUsersQuery.isLoading}
                timelines={view.workshopTimelines}
              />
              </div>
              <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-background px-6 py-4">
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

      {view.presenterUsersQuery.error && (
        <WorkshopInlineError message={view.presenterUsersQuery.error instanceof ApiError ? view.presenterUsersQuery.error.firstError : 'Failed to load presenters'} />
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workshop</TableHead>
              <TableHead>Presenter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[210px]">Time</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(view.eventsQuery.isLoading || view.workshopsQuery.isLoading) && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading workshops...
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!view.eventsQuery.isLoading && !view.workshopsQuery.isLoading && view.workshops.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No workshops found for this event.
                </TableCell>
              </TableRow>
            )}

            {view.workshops.map((workshop) => (
              <TableRow key={workshop.id}>
                <TableCell className="max-w-[420px]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                      <Presentation className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={workshop.title}>{workshop.title}</p>
                      <p className="truncate text-xs text-muted-foreground" title={workshop.meetLink || workshop.description || ''}>
                        {workshop.meetLink || workshop.description || 'No meeting link or description yet'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px]"><span className="block truncate" title={workshopPresenterLabel(workshop)}>{workshopPresenterLabel(workshop)}</span></TableCell>
                <TableCell>{workshop.status}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{formatDateTime(workshop.startTime)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(workshop.endTime)}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setDetailsWorkshop(workshop)}>
                    <Eye className="h-4 w-4" />
                    View details
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
                      <DropdownMenuItem
                        disabled={!view.canViewWorkshopRatings && !view.canViewWorkshopFeedback}
                        onClick={() => view.openReviewsDialog(workshop)}
                      >
                        View rating & feedback
                      </DropdownMenuItem>
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

      <Dialog open={Boolean(detailsWorkshop)} onOpenChange={(open) => { if (!open) setDetailsWorkshop(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsWorkshop?.title || 'Workshop details'}</DialogTitle>
            <DialogDescription>Workshop schedule, presenter, meeting link, and questionnaire.</DialogDescription>
          </DialogHeader>
          {detailsWorkshop && (
            <div className="space-y-5 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-muted-foreground">Presenter</p><p className="font-medium">{workshopPresenterLabel(detailsWorkshop)}</p></div>
                <div><p className="text-muted-foreground">Status</p><p className="font-medium">{detailsWorkshop.status}</p></div>
                <div><p className="text-muted-foreground">Starts</p><p>{formatDateTime(detailsWorkshop.startTime)}</p></div>
                <div><p className="text-muted-foreground">Ends</p><p>{formatDateTime(detailsWorkshop.endTime)}</p></div>
              </div>
              {detailsWorkshop.description && <div><p className="text-muted-foreground">Description</p><p className="whitespace-pre-wrap">{detailsWorkshop.description}</p></div>}
              {detailsWorkshop.meetLink && <div><p className="text-muted-foreground">Meeting link</p><a className="break-all text-primary underline" href={detailsWorkshop.meetLink} target="_blank" rel="noreferrer">{detailsWorkshop.meetLink}</a></div>}
              <div>
                <p className="font-medium">Workshop questionnaire</p>
                {detailsWorkshop.questionnaire?.length ? (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                    {detailsWorkshop.questionnaire.map((question, index) => <li key={`${question}-${index}`}>{question}</li>)}
                  </ol>
                ) : <p className="mt-1 text-muted-foreground">No questionnaire prepared.</p>}
              </div>
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={() => { setDetailsWorkshop(null); view.openQuestionsDialog(detailsWorkshop); }}><MessageSquare className="h-4 w-4" />View questions</Button>
                <Button variant="outline" size="sm" disabled={!view.canViewWorkshopRatings && !view.canViewWorkshopFeedback} onClick={() => { setDetailsWorkshop(null); view.openReviewsDialog(detailsWorkshop); }}><Star className="h-4 w-4" />View reviews</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={view.editOpen} onOpenChange={view.setEditOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
          <div className="flex-shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>Update the speaker, schedule, and meeting details.</DialogDescription>
          </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <WorkshopForm
            form={view.editForm}
            onChange={view.setEditForm}
            presenters={view.presenterUsers}
            presentersLoading={view.presenterUsersQuery.isLoading}
            timelines={view.workshopTimelines}
          />
          </div>
          <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-background px-6 py-4">
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
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
          <div className="flex-shrink-0 px-6 pt-6">
          <DialogHeader>
            <DialogTitle>Questions for Speaker</DialogTitle>
            <DialogDescription>
              Participant-submitted questions for {view.selectedQuestionsWorkshop?.title || 'this workshop'}.
            </DialogDescription>
          </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
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
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={view.reviewsOpen} onOpenChange={view.setReviewsOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden p-0">
          <div className="flex-shrink-0 px-6 pt-6">
            <DialogHeader>
              <DialogTitle>Rating & Feedback History</DialogTitle>
              <DialogDescription>
                Participant reviews for {view.selectedReviewsWorkshop?.title || 'this workshop'}.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Average rating</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xl font-semibold">{view.workshopRatingStats.averageRating.toFixed(1)}</span>
                    <RatingStars rating={Math.round(view.workshopRatingStats.averageRating)} />
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ratings</p>
                  <p className="mt-2 text-2xl font-semibold">{view.workshopRatingStats.totalRatings}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feedback</p>
                  <p className="mt-2 text-2xl font-semibold">{view.workshopFeedback.length}</p>
                </div>
              </div>

              {!view.canViewWorkshopRatings && !view.canViewWorkshopFeedback && (
                <WorkshopInlineError message="You do not have permission to view workshop rating or feedback history." />
              )}

              {(view.workshopRatingsQuery.error || view.workshopFeedbackQuery.error) && (
                <WorkshopInlineError
                  message={
                    view.workshopRatingsQuery.error instanceof ApiError
                      ? view.workshopRatingsQuery.error.firstError
                      : view.workshopFeedbackQuery.error instanceof ApiError
                        ? view.workshopFeedbackQuery.error.firstError
                        : 'Failed to load workshop reviews'
                  }
                />
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (view.canViewWorkshopRatings) view.workshopRatingsQuery.refetch();
                    if (view.canViewWorkshopFeedback) view.workshopFeedbackQuery.refetch();
                  }}
                  disabled={view.workshopRatingsQuery.isFetching || view.workshopFeedbackQuery.isFetching}
                >
                  {view.workshopRatingsQuery.isFetching || view.workshopFeedbackQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Participant Ratings</p>
                      <p className="text-xs text-muted-foreground">Individual scores submitted after the workshop.</p>
                    </div>
                  </div>

                  {view.workshopRatingsQuery.isLoading && (
                    <ReviewLoadingState label="Loading ratings..." />
                  )}

                  {!view.canViewWorkshopRatings && (
                    <ReviewEmptyState label="You do not have permission to view participant ratings." />
                  )}

                  {!view.workshopRatingsQuery.isLoading && view.canViewWorkshopRatings && view.workshopRatings.length === 0 && (
                    <ReviewEmptyState label="No ratings submitted yet." />
                  )}

                  {!view.workshopRatingsQuery.isLoading && view.workshopRatings.length > 0 && (
                    <div className="space-y-3">
                      {view.workshopRatings.map((rating) => (
                        <WorkshopRatingItem key={rating.id} rating={rating} />
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Participant Feedback</p>
                      <p className="text-xs text-muted-foreground">Written comments submitted by participants.</p>
                    </div>
                  </div>

                  {view.workshopFeedbackQuery.isLoading && (
                    <ReviewLoadingState label="Loading feedback..." />
                  )}

                  {!view.canViewWorkshopFeedback && (
                    <ReviewEmptyState label="You do not have permission to view participant feedback." />
                  )}

                  {!view.workshopFeedbackQuery.isLoading && view.canViewWorkshopFeedback && view.workshopFeedback.length === 0 && (
                    <ReviewEmptyState label="No feedback submitted yet." />
                  )}

                  {!view.workshopFeedbackQuery.isLoading && view.workshopFeedback.length > 0 && (
                    <div className="space-y-3">
                      {view.workshopFeedback.map((feedback) => (
                        <WorkshopFeedbackItem key={feedback.id} feedback={feedback} />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
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

function WorkshopRatingItem({ rating }: { rating: WorkshopRating }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{reviewAuthorLabel(rating.author)}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(rating.createdAt)}</p>
        </div>
        <RatingStars rating={rating.rating} />
      </div>
    </div>
  );
}

function WorkshopFeedbackItem({ feedback }: { feedback: WorkshopFeedback }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-sm leading-relaxed">{feedback.comment}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{reviewAuthorLabel(feedback.author)}</span>
        <span>{formatDateTime(feedback.createdAt)}</span>
      </div>
    </div>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

function ReviewLoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md border py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function ReviewEmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-md border py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function reviewAuthorLabel(author: WorkshopRating['author'] | WorkshopFeedback['author']) {
  return author?.fullName || author?.email || 'Anonymous participant';
}
