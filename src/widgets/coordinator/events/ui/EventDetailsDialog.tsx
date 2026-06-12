import type { Event } from '@/shared/api/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatEventDate, mapEventStatus } from '@/features/event-management/model/event-form';

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
      <DialogContent className="max-w-2xl">
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
            <div className="grid grid-cols-3 gap-4">
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
