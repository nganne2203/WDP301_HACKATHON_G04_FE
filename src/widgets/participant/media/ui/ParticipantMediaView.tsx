import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { AlertCircle, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { mediaApi } from '@/entities/media/api';
import { eventsApi } from '@/entities/event/api';
import { ApiError } from '@/shared/api/client';
import type { MediaHistoryFilter, MediaItem, MediaStatus, MediaType } from '@/shared/api/types';
import { useStore } from '@/entities/session/model/store';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
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
import {
  MediaHistoryTable,
  MediaPreview,
  MediaViewModal,
  formatFileSize,
} from '@/widgets/media/ui/MediaComponents';

const MEDIA_TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'DOCUMENT'];
const MEDIA_STATUSES: MediaStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm', 'pdf', 'doc', 'docx', 'ppt', 'pptx'];
const MAX_SIZE_BY_TYPE: Record<MediaType, number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 200 * 1024 * 1024,
  DOCUMENT: 50 * 1024 * 1024,
};

const detectMediaType = (file: File): MediaType | null => {
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('video/')) return 'VIDEO';
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && ['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(extension)) return 'DOCUMENT';
  return null;
};

const validateFile = (file: File | null) => {
  if (!file) return null;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return 'This file type is not allowed.';
  }

  const mediaType = detectMediaType(file);
  if (!mediaType) return 'The file MIME type is not supported.';

  if (file.size > MAX_SIZE_BY_TYPE[mediaType]) {
    return `${mediaType.toLowerCase()} files must be ${formatFileSize(MAX_SIZE_BY_TYPE[mediaType])} or smaller.`;
  }

  return null;
};

const buildHistoryFilters = ({
  eventId,
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
  mediaType: string;
  status: string;
  fromDate: string;
  toDate: string;
  week: string;
  month: string;
  year: string;
  page: number;
}): MediaHistoryFilter => ({
  eventId: eventId === 'ALL' ? undefined : eventId,
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

export function ParticipantMedia() {
  const queryClient = useQueryClient();
  const { user } = useStore();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [historyEventId, setHistoryEventId] = useState('ALL');
  const [historyType, setHistoryType] = useState('ALL');
  const [historyStatus, setHistoryStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [week, setWeek] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [viewMedia, setViewMedia] = useState<MediaItem | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [deleteMedia, setDeleteMedia] = useState<MediaItem | null>(null);

  const fileError = useMemo(() => validateFile(file), [file]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const { data: eventsResponse, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', 'media-selector'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
  });

  const events = eventsResponse?.data || [];

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const historyFilters = buildHistoryFilters({
    eventId: historyEventId,
    mediaType: historyType,
    status: historyStatus,
    fromDate,
    toDate,
    week,
    month,
    year,
    page,
  });

  const { data: historyResponse, isLoading: historyLoading } = useQuery({
    queryKey: ['media', 'my-history', historyFilters],
    queryFn: () => mediaApi.getMyHistory(historyFilters),
  });

  const historyItems = historyResponse?.data || [];
  const pagination = historyResponse?.pagination;

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => mediaApi.upload(formData, setUploadProgress),
    onSuccess: () => {
      toast.success('Media uploaded', { description: 'Your upload is pending moderation.' });
      setTitle('');
      setDescription('');
      setTags('');
      setFile(null);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['media', 'my-history'] });
    },
    onError: (error: unknown) => {
      const descriptionText = error instanceof ApiError ? error.firstError : 'Upload failed.';
      toast.error('Upload failed', { description: descriptionText });
      setUploadProgress(0);
    },
  });

  const viewMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.getViewUrl(mediaId),
    onSuccess: (response) => setSignedUrl(response.data.signedUrl),
    onError: (error: unknown) => {
      toast.error('Could not open media', {
        description: error instanceof ApiError ? error.firstError : 'Signed URL request failed.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.delete(mediaId),
    onSuccess: () => {
      toast.success('Media deleted');
      setDeleteMedia(null);
      queryClient.invalidateQueries({ queryKey: ['media', 'my-history'] });
    },
    onError: (error: unknown) => {
      toast.error('Delete failed', {
        description: error instanceof ApiError ? error.firstError : 'Could not delete media.',
      });
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
  };

  const handleUpload = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedEventId) {
      toast.error('Select an event before uploading.');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!file) {
      toast.error('Select a file before uploading.');
      return;
    }
    if (fileError) {
      toast.error('File is not valid', { description: fileError });
      return;
    }

    const formData = new FormData();
    formData.append('eventId', selectedEventId);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('tags', tags.trim());
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  const handleOpenMedia = (media: MediaItem) => {
    setViewMedia(media);
    setSignedUrl(null);
    viewMutation.mutate(media.id);
  };

  const canDelete = (media: MediaItem) => media.status === 'PENDING' && (!media.uploadedById || media.uploadedById === user?.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Media</h1>
        <p className="text-sm text-muted-foreground">Upload event media and track moderation status.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(360px,440px)_1fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Upload Media</CardTitle>
            <CardDescription>Images, videos, and documents are reviewed before appearing in the gallery.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Event</Label>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Select value={selectedEventId} onValueChange={setSelectedEventId} disabled={eventsLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEventId ? (
                    <Button asChild variant="outline">
                      <Link to={`/events/${selectedEventId}/gallery`}>
                        Gallery
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      Gallery
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="media-title">Title</Label>
                <Input id="media-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media-description">Description</Label>
                <Textarea id="media-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media-tags">Tags</Label>
                <Input id="media-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="team, demo, awards" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media-file">File</Label>
                <Input id="media-file" type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.pdf,.doc,.docx,.ppt,.pptx" />
                {fileError && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {fileError}
                  </p>
                )}
              </div>

              <MediaPreview file={file} previewUrl={previewUrl} />

              {uploadMutation.isPending && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={uploadMutation.isPending || Boolean(fileError)}>
                {uploadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Upload
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>My Upload History</CardTitle>
            <CardDescription>Filter media by event, type, status, and upload date.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={historyEventId} onValueChange={(value) => { setHistoryEventId(value); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Event" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={historyType} onValueChange={(value) => { setHistoryType(value); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {MEDIA_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={historyStatus} onValueChange={(value) => { setHistoryStatus(value); setPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {MEDIA_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Year" value={year} onChange={(event) => { setYear(event.target.value); setPage(1); }} />
              <Input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} />
              <Input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1); }} />
              <Input type="number" min={1} max={53} placeholder="Week" value={week} onChange={(event) => { setWeek(event.target.value); setPage(1); }} />
              <Input type="number" min={1} max={12} placeholder="Month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(1); }} />
            </div>

            {historyLoading ? (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading history...
              </div>
            ) : (
              <MediaHistoryTable
                items={historyItems}
                onView={handleOpenMedia}
                onDelete={(media) => setDeleteMedia(media)}
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

      <AlertDialog open={Boolean(deleteMedia)} onOpenChange={(open) => !open && setDeleteMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              Pending media can be deleted before moderation. This action removes the file and metadata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteMedia && !canDelete(deleteMedia) && (
            <p className="text-sm text-red-600">Only your own pending uploads can be deleted.</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!deleteMedia || !canDelete(deleteMedia) || deleteMutation.isPending}
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
