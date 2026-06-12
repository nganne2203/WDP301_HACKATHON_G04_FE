import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { eventsApi } from '@/entities/event/api';
import { mediaApi } from '@/entities/media/api';
import { useStore } from '@/entities/session/model/store';
import type { MediaItem } from '@/shared/api/types';

import { buildAdminMediaFilters, getAdminMediaErrorMessage } from './admin-media.utils';

export function useAdminMediaView() {
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

  const filters = buildAdminMediaFilters({
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

  const eventsQuery = useQuery({
    queryKey: ['events', 'admin-media'],
    queryFn: () => eventsApi.list({ page: 1, limit: 100 }),
    enabled: canManage,
  });

  const mediaQuery = useQuery({
    queryKey: ['media', 'admin', filters],
    queryFn: () => mediaApi.getAdminMedia(filters),
    enabled: canManage,
  });

  const statisticsQuery = useQuery({
    queryKey: ['media', 'statistics', statisticsFilters],
    queryFn: () => mediaApi.getStatistics(statisticsFilters),
    enabled: canManage,
  });

  const events = eventsQuery.data?.data || [];
  const mediaItems = mediaQuery.data?.data || [];
  const pagination = mediaQuery.data?.pagination;
  const statistics = statisticsQuery.data?.data;
  const mediaTypeCounts = new Map((statistics?.uploadsByMediaType || []).map((item) => [item.mediaType, item.count]));

  const viewMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.getViewUrl(mediaId),
    onSuccess: (response) => setSignedUrl(response.data.signedUrl),
    onError: (error: unknown) => {
      toast.error('Could not open media', {
        description: getAdminMediaErrorMessage(error, 'Signed URL request failed.'),
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.approve(mediaId),
    onSuccess: async () => {
      toast.success('Media approved');
      await queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      toast.error('Approve failed', {
        description: getAdminMediaErrorMessage(error, 'Could not approve media.'),
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ mediaId, reason }: { mediaId: string; reason: string }) => mediaApi.reject(mediaId, reason),
    onSuccess: async () => {
      toast.success('Media rejected');
      setRejectMedia(null);
      setRejectReason('');
      await queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      toast.error('Reject failed', {
        description: getAdminMediaErrorMessage(error, 'Could not reject media.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.delete(mediaId),
    onSuccess: async () => {
      toast.success('Media deleted');
      setDeleteMedia(null);
      await queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (error: unknown) => {
      toast.error('Delete failed', {
        description: getAdminMediaErrorMessage(error, 'Could not delete media.'),
      });
    },
  });

  const handleOpenMedia = (media: MediaItem) => {
    setViewMedia(media);
    setSignedUrl(null);
    viewMutation.mutate(media.id);
  };

  const resetPage = () => setPage(1);

  return {
    canManage,
    eventId,
    setEventId,
    uploadedBy,
    setUploadedBy,
    teamId,
    setTeamId,
    mediaType,
    setMediaType,
    status,
    setStatus,
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
    viewMedia,
    setViewMedia,
    signedUrl,
    setSignedUrl,
    rejectMedia,
    setRejectMedia,
    rejectReason,
    setRejectReason,
    deleteMedia,
    setDeleteMedia,
    eventsQuery,
    mediaQuery,
    statisticsQuery,
    events,
    mediaItems,
    pagination,
    statistics,
    mediaTypeCounts,
    viewMutation,
    approveMutation,
    rejectMutation,
    deleteMutation,
    handleOpenMedia,
    resetPage,
  };
}
