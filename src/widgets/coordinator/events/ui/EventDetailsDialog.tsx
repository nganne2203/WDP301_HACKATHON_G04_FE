import type { Event } from '@/shared/api/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { StatusBadge } from '@/shared/ui/status-badge';
import { describeAdvancementRule, formatEventDate, mapEventStatus } from '@/features/event-management/model/event-form';

export function EventDetailsDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[min(50rem,calc(100vw-2rem))] !max-w-none">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
          <DialogDescription>Detailed information about the event.</DialogDescription>
        </DialogHeader>
        {event && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Event Title</Label>
                <p className="font-medium mt-1">{event.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Semester</Label>
                <p className="font-medium mt-1">{event.semester || '-'}</p>
              </div>
            </div>
            {event.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm">{event.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium mt-1">{formatEventDate(event.startDate)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">End Date</Label>
                <p className="font-medium mt-1">{formatEventDate(event.endDate)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <StatusBadge status={mapEventStatus(event.status) as never} />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <p className="font-medium mt-1">{event.createdBy?.fullName || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Team Size</Label>
                <p className="font-medium mt-1">
                  {event.minTeamMembers || '?'} - {event.maxTeamMembers || '?'} members
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Rounds</Label>
                <p className="font-medium mt-1">{event.roundCount ?? 0}</p>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <Label className="text-muted-foreground">Advancement Rules</Label>
              <p className="mt-1 font-medium">{describeAdvancementRule(event)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Boards</span>
                  <p className="font-medium">{event.competitionConfig?.boardCount || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teams / board</span>
                  <p className="font-medium">{event.competitionConfig?.maxTeamsPerBoard || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Advance / board</span>
                  <p className="font-medium">{event.competitionConfig?.finalistsPerBoard ?? event.finalistSlotsPerTrack ?? '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total advance</span>
                  <p className="font-medium">{event.competitionConfig?.finalistCount ?? event.totalFinalistSlots ?? '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
