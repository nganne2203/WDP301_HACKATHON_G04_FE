import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { MediaHistoryTable } from '@/widgets/media/ui/MediaComponents';
import type { MediaItem, MediaStatus, MediaType } from '@/shared/api/types';

export function MediaHistoryCard({
  mediaTypes,
  mediaStatuses,
  historyType,
  setHistoryType,
  historyStatus,
  setHistoryStatus,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  week,
  setWeek,
  month,
  setMonth,
  year,
  setYear,
  page,
  setPage,
  historyLoading,
  historyItems,
  pagination,
  onView,
  onDelete,
}: {
  mediaTypes: MediaType[];
  mediaStatuses: MediaStatus[];
  historyType: string;
  setHistoryType: (value: string) => void;
  historyStatus: string;
  setHistoryStatus: (value: string) => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
  week: string;
  setWeek: (value: string) => void;
  month: string;
  setMonth: (value: string) => void;
  year: string;
  setYear: (value: string) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  historyLoading: boolean;
  historyItems: MediaItem[];
  pagination: { currentPage?: number; totalPages?: number } | undefined;
  onView: (media: MediaItem) => void;
  onDelete: (media: MediaItem) => void;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>My Upload History</CardTitle>
        <CardDescription>Filter media by type, status, and upload date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select value={historyType} onValueChange={(value) => { setHistoryType(value); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {mediaTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={historyStatus} onValueChange={(value) => { setHistoryStatus(value); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {mediaStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Year" value={year} onChange={(competition) => { setYear(competition.target.value); setPage(1); }} />
          <Input type="date" value={fromDate} onChange={(competition) => { setFromDate(competition.target.value); setPage(1); }} />
          <Input type="date" value={toDate} onChange={(competition) => { setToDate(competition.target.value); setPage(1); }} />
          <Input type="number" min={1} max={53} placeholder="Week" value={week} onChange={(competition) => { setWeek(competition.target.value); setPage(1); }} />
          <Input type="number" min={1} max={12} placeholder="Month" value={month} onChange={(competition) => { setMonth(competition.target.value); setPage(1); }} />
        </div>

        {historyLoading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading history...
          </div>
        ) : (
          <MediaHistoryTable items={historyItems} onView={onView} onDelete={onDelete} />
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination?.currentPage || page} of {pagination?.totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <Button variant="outline" disabled={page >= (pagination?.totalPages || 1)} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
