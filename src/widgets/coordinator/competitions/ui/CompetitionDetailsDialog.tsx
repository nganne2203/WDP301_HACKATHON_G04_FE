import type { Competition } from '@/shared/api/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { StatusBadge } from '@/shared/ui/status-badge';
import { describeAdvancementRule, formatCompetitionDate, mapCompetitionStatus } from '@/features/competition-management/model/competition-form';

export function CompetitionDetailsDialog({
  open,
  onOpenChange,
  competition,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: Competition | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[min(50rem,calc(100vw-2rem))] !max-w-none">
        <DialogHeader>
          <DialogTitle>Competition Details</DialogTitle>
          <DialogDescription>Detailed information about the competition.</DialogDescription>
        </DialogHeader>
        {competition && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Competition Title</Label>
                <p className="font-medium mt-1">{competition.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Semester</Label>
                <p className="font-medium mt-1">{competition.semester || '-'}</p>
              </div>
            </div>
            {competition.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm">{competition.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium mt-1">{formatCompetitionDate(competition.startDate)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">End Date</Label>
                <p className="font-medium mt-1">{formatCompetitionDate(competition.endDate)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <StatusBadge status={mapCompetitionStatus(competition.status) as never} />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <p className="font-medium mt-1">{competition.createdBy?.fullName || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Team Size</Label>
                <p className="font-medium mt-1">
                  {competition.minTeamMembers || '?'} - {competition.maxTeamMembers || '?'} members
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Rounds</Label>
                <p className="font-medium mt-1">{competition.roundCount ?? 0}</p>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <Label className="text-muted-foreground">Advancement Rules</Label>
              <p className="mt-1 font-medium">{describeAdvancementRule(competition)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Boards</span>
                  <p className="font-medium">{competition.competitionConfig?.boardCount || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Teams / board</span>
                  <p className="font-medium">{competition.competitionConfig?.maxTeamsPerBoard || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Advance / board</span>
                  <p className="font-medium">{competition.competitionConfig?.finalistsPerBoard ?? competition.finalistSlotsPerTrack ?? '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total advance</span>
                  <p className="font-medium">{competition.competitionConfig?.finalistCount ?? competition.totalFinalistSlots ?? '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
