import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { mediaApi } from '@/entities/media/api';
import { useEventsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import type { MediaItem } from '@/shared/api/types';

import {
  buildHistoryFilters,
  canDeleteMedia,
  getMediaErrorMessage,
  validateFile,
} from './media-view.utils';

export function useParticipantMediaView() {
  const queryClient = useQueryClient();
  const user = useStore((state) => state.user);
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

  const eventsQuery = useEventsQuery();

  const events = eventsQuery.data || [];

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

  const historyQuery = useQuery({
    queryKey: queryKeys.media.history(historyFilters),
    queryFn: () => mediaApi.getMyHistory(historyFilters),
  });

  const historyItems = historyQuery.data?.data || [];
  const pagination = historyQuery.data?.pagination;

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => mediaApi.upload(formData, setUploadProgress),
    onSuccess: async () => {
      toast.success('Media uploaded', { description: 'Your upload is pending moderation.' });
      setTitle('');
      setDescription('');
      setTags('');
      setFile(null);
      setUploadProgress(0);
      await queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
    onError: (error: unknown) => {
      toast.error('Upload failed', { description: getMediaErrorMessage(error, 'Upload failed.') });
      setUploadProgress(0);
    },
  });

  const viewMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.getViewUrl(mediaId),
    onSuccess: (response) => setSignedUrl(response.data.signedUrl),
    onError: (error: unknown) => {
      toast.error('Could not open media', {
        description: getMediaErrorMessage(error, 'Signed URL request failed.'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => mediaApi.delete(mediaId),
    onSuccess: async () => {
      toast.success('Media deleted');
      setDeleteMedia(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.media.all });
    },
    onError: (error: unknown) => {
      toast.error('Delete failed', {
        description: getMediaErrorMessage(error, 'Could not delete media.'),
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

  return {
    user,
    selectedEventId,
    setSelectedEventId,
    title,
    setTitle,
    description,
    setDescription,
    tags,
    setTags,
    file,
    previewUrl,
    uploadProgress,
    historyEventId,
    setHistoryEventId,
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
    viewMedia,
    setViewMedia,
    signedUrl,
    setSignedUrl,
    deleteMedia,
    setDeleteMedia,
    fileError,
    eventsQuery,
    events,
    historyQuery,
    historyItems,
    pagination,
    uploadMutation,
    viewMutation,
    deleteMutation,
    handleFileChange,
    handleUpload,
    handleOpenMedia,
    canDelete: (media: MediaItem) => canDeleteMedia(media, user?.id),
  };
}
