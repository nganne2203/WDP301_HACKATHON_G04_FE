import { Loader2 } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { MediaHistoryTable, MediaStatisticsCards } from '@/widgets/media/ui/MediaComponents';
import type { MediaItem, MediaStatus, MediaType } from '@/shared/api/types';

export function AdminMediaFiltersCard({
  statisticsLoading,
  statistics,
  mediaTypeCounts,
  mediaType,
  setMediaType,
  status,
  setStatus,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  mediaLoading,
  mediaItems,
  onView,
  onApprove,
  onReject,
  onDelete,
  page,
  setPage,
  pagination,
  mediaTypes,
  mediaStatuses,
  resetPage,
}: {
  statisticsLoading: boolean;
  statistics: any;
  mediaTypeCounts: Map<string, number>;
  mediaType: string;
  setMediaType: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
  mediaLoading: boolean;
  mediaItems: MediaItem[];
  onView: (media: MediaItem) => void;
  onApprove: (media: MediaItem) => void;
  onReject: (media: MediaItem) => void;
  onDelete: (media: MediaItem) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pagination: { currentPage?: number; totalPages?: number } | undefined;
  mediaTypes: MediaType[];
  mediaStatuses: MediaStatus[];
  resetPage: () => void;
}) {
  return (
    <>
      {statisticsLoading ? (
        <div className="flex h-24 items-center text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading statistics...
        </div>
      ) : (
        <MediaStatisticsCards
          totalUploads={statistics?.totalUploads || 0}
          totalImages={mediaTypeCounts.get('IMAGE') || 0}
          totalVideos={mediaTypeCounts.get('VIDEO') || 0}
          totalDocuments={mediaTypeCounts.get('DOCUMENT') || 0}
          pending={statistics?.pending || 0}
          approved={statistics?.approved || 0}
          rejected={statistics?.rejected || 0}
        />
      )}

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Uploads</CardTitle>
          <CardDescription>Filter and moderate media for the selected competition.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Select value={mediaType} onValueChange={(value) => { setMediaType(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                {mediaTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(value) => { setStatus(value); resetPage(); }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {mediaStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(competition) => { setFromDate(competition.target.value); resetPage(); }} />
            <Input type="date" value={toDate} onChange={(competition) => { setToDate(competition.target.value); resetPage(); }} />
          </div>

          {mediaLoading ? (
            <div className="flex h-56 items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading media...
            </div>
          ) : (
            <MediaHistoryTable
              items={mediaItems}
              onView={onView}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete}
              admin
            />
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
    </>
  );
}
