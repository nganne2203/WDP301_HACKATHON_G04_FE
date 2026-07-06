import { Loader2, MessageSquare, Presentation, RefreshCw, Send, Star, ThumbsUp, Video } from 'lucide-react';

import { useParticipantWorkshopsView } from '../model/useParticipantWorkshopsView';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { formatDateTime } from '@/widgets/coordinator/workshops/model/workshop-form';
import { ApiError } from '@/shared/api/client';

export function ParticipantWorkshops() {
  const view = useParticipantWorkshopsView();

  const activeWorkshops = view.workshops.filter((w) => w.status === 'LIVE');
  const upcomingWorkshops = view.workshops.filter((w) => w.status === 'SCHEDULED');
  const completedWorkshops = view.workshops.filter((w) => w.status === 'COMPLETED' || w.status === 'CANCELLED');

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Presentation className="h-8 w-8 text-blue-600" />
            Workshops & Seminars
          </h1>
          <p className="text-muted-foreground mt-1">
            Join live sessions, ask questions to presenters, and rate your learning experience.
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex items-center gap-2">
          {view.eventsQuery.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Select
              value={view.activeEvent?.id || ''}
              onValueChange={view.setSelectedEventId}
            >
              <SelectTrigger className="w-[260px] bg-background">
                <SelectValue placeholder="Select Event" />
              </SelectTrigger>
              <SelectContent>
                {view.events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => view.workshopsQuery.refetch()}
            disabled={view.workshopsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${view.workshopsQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {view.workshopsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading workshops schedule...</p>
        </div>
      ) : view.workshops.length === 0 ? (
        <Card className="border-dashed py-12 flex flex-col items-center justify-center text-center">
          <Presentation className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <CardTitle className="text-lg">No workshops scheduled yet</CardTitle>
          <CardDescription className="max-w-xs mt-1">
            Keep an eye on this space. Seminars and workshops for {view.activeEvent?.title || 'this event'} will appear here.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* 1. Live Now Section */}
          {activeWorkshops.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Happening Now
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeWorkshops.map((workshop) => (
                  <Card key={workshop.id} className="relative border-red-200 bg-red-50/10 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <Badge variant="destructive" className="animate-pulse">LIVE NOW</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(workshop.startTime)}</span>
                      </div>
                      <CardTitle className="text-xl mt-2">{workshop.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{workshop.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {workshop.speakerInfo?.name && (
                        <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-red-100">
                          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                            {workshop.speakerInfo.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{workshop.speakerInfo.name}</p>
                            <p className="text-xs text-muted-foreground">{workshop.speakerInfo.title || 'Presenter'}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        {workshop.meetLink && (
                          <Button asChild className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium gap-2">
                            <a href={workshop.meetLink} target="_blank" rel="noreferrer">
                              <Video className="h-4 w-4" />
                              Join Meeting
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => view.openDetailSheet(workshop)}
                          className="flex-1 gap-2 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Q&A & Feedback
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 2. Upcoming Workshops */}
          {upcomingWorkshops.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upcoming Schedule</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingWorkshops.map((workshop) => (
                  <Card key={workshop.id} className="hover:shadow-md transition-shadow duration-300 cursor-pointer" onClick={() => view.openDetailSheet(workshop)}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50/50">SCHEDULED</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(workshop.startTime)}</span>
                      </div>
                      <CardTitle className="text-lg mt-2 line-clamp-1">{workshop.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{workshop.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {workshop.speakerInfo?.name && (
                        <div className="text-xs text-muted-foreground border-t pt-3 flex items-center justify-between">
                          <span>Presenter: <strong>{workshop.speakerInfo.name}</strong></span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 3. Completed Seminars */}
          {completedWorkshops.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-muted-foreground">Completed Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {completedWorkshops.map((workshop) => (
                  <Card key={workshop.id} className="opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-pointer" onClick={() => view.openDetailSheet(workshop)}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">{workshop.status}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(workshop.startTime)}</span>
                      </div>
                      <CardTitle className="text-lg mt-2 text-muted-foreground line-clamp-1">{workshop.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground flex items-center justify-between border-t pt-3">
                        <span>Speaker: {workshop.speakerInfo?.name || 'TBA'}</span>
                        <span className="flex items-center text-amber-500 gap-1">
                          <Star className="h-3 w-3 fill-amber-500" />
                          Inspect / Feedback
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workshop Details, Q&A & Feedback Modal */}
      <Dialog open={view.isDetailOpen} onOpenChange={(open) => !open && view.closeDetailSheet()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {view.selectedWorkshop && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant={view.selectedWorkshop.status === 'LIVE' ? 'destructive' : 'outline'}>
                    {view.selectedWorkshop.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(view.selectedWorkshop.startTime)} - {formatDateTime(view.selectedWorkshop.endTime)}
                  </span>
                </div>
                <DialogTitle className="text-2xl pt-2">{view.selectedWorkshop.title}</DialogTitle>
                <DialogDescription>{view.selectedWorkshop.description}</DialogDescription>
              </DialogHeader>

              {/* Speaker Details */}
              {view.selectedWorkshop.speakerInfo?.name && (
                <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                  <h4 className="text-sm font-semibold">Speaker / Presenter</h4>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      {view.selectedWorkshop.speakerInfo.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{view.selectedWorkshop.speakerInfo.name}</p>
                      <p className="text-xs text-muted-foreground">{view.selectedWorkshop.speakerInfo.title || 'Guest Presenter'}</p>
                      {view.selectedWorkshop.speakerInfo.bio && (
                        <p className="text-xs text-muted-foreground mt-2 border-t pt-2 italic">{view.selectedWorkshop.speakerInfo.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(view.canCreateRating || view.canCreateFeedback) && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    Leave Feedback & Rating
                  </h3>
                  <div className="space-y-4">
                    {view.canCreateRating && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium mr-2">Your Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => view.setRatingValue(star)}
                            className="focus:outline-none transition-transform active:scale-95"
                          >
                            <Star
                              className={`h-7 w-7 ${
                                star <= view.ratingValue
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          </button>
                        ))}
                        <Button
                          size="sm"
                          className="ml-auto"
                          onClick={() => view.handleRateWorkshop(view.ratingValue)}
                          disabled={view.createRatingMutation.isPending}
                        >
                          {view.createRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                        </Button>
                      </div>
                    )}

                    {view.canCreateFeedback && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Share your thoughts about this session..."
                          value={view.feedbackContent}
                          onChange={(e) => view.setFeedbackContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={view.handleFeedbackSubmit}
                            disabled={!view.feedbackContent.trim() || view.createFeedbackMutation.isPending}
                          >
                            {view.createFeedbackMutation.isPending ? 'Submitting...' : 'Submit Review'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Live Q&A Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Live Questionnaire
                </h3>

                {/* Submitting a question */}
                {view.canCreateQuestion && ['SCHEDULED', 'LIVE'].includes(view.selectedWorkshop.status) ? (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ask the presenter a question..."
                      value={view.questionContent}
                      onChange={(e) => view.setQuestionContent(e.target.value)}
                      rows={1}
                      className="resize-none"
                    />
                    <Button
                      size="icon"
                      onClick={view.handleCreateQuestion}
                      disabled={!view.questionContent.trim() || view.createQuestionMutation.isPending}
                      className="h-auto bg-blue-600 hover:bg-blue-700"
                    >
                      {view.createQuestionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 text-white" />
                      )}
                    </Button>
                  </div>
                ) : ['SCHEDULED', 'LIVE'].includes(view.selectedWorkshop.status) ? (
                  <p className="text-xs text-muted-foreground">You can view workshop questions, but this account cannot submit new ones.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Q&A session is closed for this workshop.</p>
                )}

                {/* List of Questions */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 mt-2">
                  {view.workshopQuestionsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : view.workshopQuestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No questions asked yet. Be the first!</p>
                  ) : (
                    view.workshopQuestions.map((q) => (
                      <div key={q.id} className="flex justify-between items-start gap-4 p-3 bg-muted/30 rounded-lg border text-sm">
                        <div className="space-y-1">
                          <p className="text-foreground">{q.content}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>By: {q.author?.fullName || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{q.voteCount || 0} vote(s)</span>
                          </div>
                        </div>
                        {view.canVoteQuestion && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => view.voteQuestionMutation.mutate(q.id)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 text-muted-foreground hover:text-blue-600"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
