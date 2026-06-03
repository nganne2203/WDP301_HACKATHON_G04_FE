import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { eventsApi } from '../../../lib/api/events';
import { mediaApi } from '../../../lib/api/media';
import { ApiError } from '../../../lib/api/client';
import type { AdminMediaFilter, MediaItem, MediaStatus, MediaType } from '../../../lib/api/types';
import { useStore } from '../../../store/useStore';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  MediaHistoryTable,
  MediaStatisticsCards,
  MediaViewModal,
  RejectMediaModal,
} from '../../components/media/MediaComponents';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const MEDIA_TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'DOCUMENT'];
const MEDIA_STATUSES: MediaStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const buildFilters = ({
  eventId,
  uploadedBy,
  teamId,
  mediaType,
  status,
  fromDate,
  toDate,
  week,
  month,
  year,
  page,
}: {
  eventId: string;
  uploadedBy: string;
  teamId: string;
  mediaType: string;
  status: string;
  fromDate: string;
  toDate: string;
  week: string;
  month: string;
  year: string;
  page: number;
}): AdminMediaFilter => ({
  eventId: eventId === 'ALL' ? undefined : eventId,
  uploadedBy: uploadedBy || undefined,
  teamId: teamId || undefined,
  mediaType: mediaType === 'ALL' ? undefined : mediaType as MediaType,
  status: status === 'ALL' ? undefined : status as MediaStatus,
  fromDate: fromDate || undefined,
  toDate: toDate || undefined,
  week: week ? Number(week) : undefined,
  month: month ? Number(month) : undefined,
  year: year ? Number(year) : undefined,
  page,
  limit: 10,
});

export function AdminMedia() {
  const queryClient = useQueryClient();
  const hasPermission = useStore((state) => state.hasPermission);
  const [eventId, setEventId] = useState('ALL');
  const [uploadedBy, setUploadedBy] = useState('');
  const [teamId, setTeamId] = useState('');
  const [mediaType, setMediaType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [week, setWeek] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [viewMedia, setViewMedia] = useState<MediaItem | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [rejectMedia, setRejectMedia] = useState<MediaItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteMedia, setDeleteMedia] = useState<MediaItem | null>(null);

  const canManage = hasPermission('EVENT_UPDATE');

  const filters = buildFilters({
    eventId,
    uploadedBy,
    teamId,
    mediaType,
    status,
    fromDate,
    toDate,
    week,
    month,
    year,
    page,
  });

  const statisticsFilters = useMemo(() => ({
    eventId: eventId === 'ALL' ? undefined : eventId,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  }), [eventId, fromDate, toDate]);

  const { data: eventsResponse } = useQuery({
    queryKey: ['events', 'admin-media'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
    enabled: canManage,
  });

  const { data: mediaResponse, isLoading: mediaLoading } = useQuery({
    queryKey: ['media', 'admin', filters],
    queryFn: () => mediaApi.getAdminMedia(filters),
    enabled: canManage,
  });

  const { data: statisticsResponse, isLoading: statisticsLoading } = useQuery({
    queryKey: ['media', 'statistics', statisticsFilters],
    queryFn: () => mediaApi.getStatistics(statisticsFilters),
    enabled: canManage,
  });

  const events = eventsResponse?.data || [];
  const mediaItems = mediaResponse?.data || [];
  const pagination = mediaResponse?.pagination;
  const statistics = statisticsResponse?.data;
  const mediaTypeCounts = new Map((statistics?.uploadsByMediaType || []).map((item) => [item.mediaType, item.count]));

  const viewMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.getViewUrl(mediaId),
    onSuccess: (response) => setSignedUrl(response.data.signedUrl),
    onError: (error: unknown) => {
      toast.error('Could not open media', {
        description: error instanceof ApiError ? error.firstError : 'Signed URL request failed.',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.approve(mediaId),
    onSuccess: () => {
      toast.success('Media approved');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      toast.error('Approve failed', {
        description: error instanceof ApiError ? error.firstError : 'Could not approve media.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ mediaId, reason }: { mediaId: string; reason: string }) => mediaApi.reject(mediaId, reason),
    onSuccess: () => {
      toast.success('Media rejected');
      setRejectMedia(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      toast.error('Reject failed', {
        description: error instanceof ApiError ? error.firstError : 'Could not reject media.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.delete(mediaId),
    onSuccess: () => {
      toast.success('Media deleted');
      setDeleteMedia(null);
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      toast.error('Delete failed', {
        description: error instanceof ApiError ? error.firstError : 'Could not delete media.',
      });
    },
  });

  const handleOpenMedia = (media: MediaItem) => {
    setViewMedia(media);
    setSignedUrl(null);
    viewMutation.mutate(media.id);
  };

  const resetPage = () => setPage(1);

  if (!canManage) {
    return (
      <div className="p-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Media Management</CardTitle>
            <CardDescription>You need event update permission to manage media.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Media Management</h1>
        <p className="text-sm text-muted-foreground">Moderate uploads, inspect private media, and monitor upload activity.</p>
      </div>

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Uploads</CardTitle>
            <CardDescription>Filter and moderate all event media.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={eventId} onValueChange={(value) => { setEventId(value); resetPage(); }}>
                <SelectTrigger><SelectValue placeholder="Event" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mediaType} onValueChange={(value) => { setMediaType(value); resetPage(); }}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {MEDIA_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => { setStatus(value); resetPage(); }}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {MEDIA_STATUSES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Uploader ID" value={uploadedBy} onChange={(event) => { setUploadedBy(event.target.value); resetPage(); }} />
              <Input placeholder="Team ID" value={teamId} onChange={(event) => { setTeamId(event.target.value); resetPage(); }} />
              <Input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); resetPage(); }} />
              <Input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); resetPage(); }} />
              <Input type="number" placeholder="Year" value={year} onChange={(event) => { setYear(event.target.value); resetPage(); }} />
              <Input type="number" min={1} max={53} placeholder="Week" value={week} onChange={(event) => { setWeek(event.target.value); resetPage(); }} />
              <Input type="number" min={1} max={12} placeholder="Month" value={month} onChange={(event) => { setMonth(event.target.value); resetPage(); }} />
            </div>

            {mediaLoading ? (
              <div className="flex h-56 items-center justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading media...
              </div>
            ) : (
              <MediaHistoryTable
                items={mediaItems}
                onView={handleOpenMedia}
                onApprove={(media) => approveMutation.mutate(media.id)}
                onReject={(media) => {
                  setRejectMedia(media);
                  setRejectReason('');
                }}
                onDelete={(media) => setDeleteMedia(media)}
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

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Activity Leaders</CardTitle>
            <CardDescription>Top uploaders and most-viewed media.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-medium">Most active participants</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead className="text-right">Uploads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(statistics?.mostActiveParticipants || []).slice(0, 5).map((item) => (
                    <TableRow key={item.participantId}>
                      <TableCell className="max-w-[220px] truncate">{item.participantId}</TableCell>
                      <TableCell className="text-right">{item.uploads}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Most viewed media</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Media</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(statistics?.mostViewedMedia || []).slice(0, 5).map((item) => (
                    <TableRow key={item.mediaId}>
                      <TableCell className="max-w-[220px] truncate">{item.mediaId}</TableCell>
                      <TableCell className="text-right">{item.views}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <MediaViewModal
        media={viewMedia}
        signedUrl={signedUrl}
        loading={viewMutation.isPending}
        open={Boolean(viewMedia)}
        onOpenChange={(open) => {
          if (!open) {
            setViewMedia(null);
            setSignedUrl(null);
          }
        }}
      />

      <RejectMediaModal
        media={rejectMedia}
        reason={rejectReason}
        loading={rejectMutation.isPending}
        open={Boolean(rejectMedia)}
        onReasonChange={setRejectReason}
        onOpenChange={(open) => {
          if (!open) {
            setRejectMedia(null);
            setRejectReason('');
          }
        }}
        onConfirm={() => rejectMedia && rejectMutation.mutate({ mediaId: rejectMedia.id, reason: rejectReason.trim() })}
      />

      <AlertDialog open={Boolean(deleteMedia)} onOpenChange={(open) => !open && setDeleteMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the stored file and metadata for {deleteMedia?.title || deleteMedia?.originalFileName || 'this item'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteMedia || deleteMutation.isPending}
              onClick={() => deleteMedia && deleteMutation.mutate(deleteMedia.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
