import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { eventsApi } from '../../lib/api/events';
import { mediaApi } from '../../lib/api/media';
import { ApiError } from '../../lib/api/client';
import type { MediaItem, MediaType } from '../../lib/api/types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MediaCard, MediaStatisticsCards, MediaViewModal } from '../components/media/MediaComponents';

const MEDIA_TYPES: MediaType[] = ['IMAGE', 'VIDEO', 'DOCUMENT'];

export function EventGallery() {
  const { eventId = '' } = useParams();
  const [mediaType, setMediaType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [viewMedia, setViewMedia] = useState<MediaItem | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const filters = useMemo(() => ({
    mediaType: mediaType === 'ALL' ? undefined : mediaType as MediaType,
    search: search || undefined,
  }), [mediaType, search]);

  const { data: eventResponse } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => eventsApi.getById(eventId),
    enabled: Boolean(eventId),
  });

  const { data: galleryResponse, isLoading } = useQuery({
    queryKey: ['media', 'gallery', eventId, filters],
    queryFn: () => mediaApi.getEventGallery(eventId, filters),
    enabled: Boolean(eventId),
  });

  const gallery = galleryResponse?.data;
  const allItems = useMemo(() => {
    if (!gallery) return [];
    return [...gallery.images, ...gallery.videos, ...gallery.documents];
  }, [gallery]);

  const viewMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.getViewUrl(mediaId),
    onSuccess: (response) => setSignedUrl(response.data.signedUrl),
    onError: (error: unknown) => {
      toast.error('Could not open media', {
        description: error instanceof ApiError ? error.firstError : 'Signed URL request failed.',
      });
    },
  });

  const handleOpenMedia = (media: MediaItem) => {
    setViewMedia(media);
    setSignedUrl(null);
    viewMutation.mutate(media.id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link to="/participant/media">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to media
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Event Gallery</h1>
          <p className="text-sm text-muted-foreground">
            {eventResponse?.data.title || 'Approved event media'}
          </p>
        </div>
      </div>

      <MediaStatisticsCards
        totalUploads={gallery?.statistics.totalUploads || 0}
        totalImages={gallery?.statistics.totalImages || 0}
        totalVideos={gallery?.statistics.totalVideos || 0}
        totalDocuments={gallery?.statistics.totalDocuments || 0}
        pending={0}
        approved={gallery?.statistics.totalUploads || 0}
        rejected={0}
      />

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Approved Media</CardTitle>
          <CardDescription>Private media is opened through a temporary signed URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
            <Select value={mediaType} onValueChange={setMediaType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All media</SelectItem>
                {MEDIA_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, description, or tags"
                className="pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-56 items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading gallery...
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No approved media found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {allItems.map((media) => (
                <MediaCard key={media.id} media={media} onView={handleOpenMedia} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
