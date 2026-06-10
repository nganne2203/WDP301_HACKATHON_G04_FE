import type { UserStatus } from '@/shared/api/types';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

import type { ParticipantFilterType } from '../model/participants-view.utils';

export function ParticipantFiltersSheet({
  open,
  onOpenChange,
  activeFilter,
  setActiveFilter,
  filterCounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilter: ParticipantFilterType;
  setActiveFilter: (value: ParticipantFilterType) => void;
  filterCounts: Record<ParticipantFilterType, number>;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Participants</SheetTitle>
          <SheetDescription>
            Apply advanced filters to narrow down the participant list.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="space-y-2">
              {(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as UserStatus[]).map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-${status}`}
                    checked={activeFilter === status}
                    onCheckedChange={(checked) => {
                      if (checked) setActiveFilter(status);
                      else setActiveFilter('all');
                    }}
                  />
                  <label htmlFor={`filter-${status}`} className="text-sm cursor-pointer capitalize">
                    {status.toLowerCase()} ({filterCounts[status]})
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setActiveFilter('all');
                onOpenChange(false);
              }}
            >
              Clear Filters
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
