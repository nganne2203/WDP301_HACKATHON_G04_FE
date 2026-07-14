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
import { MediaViewModal } from '@/widgets/media/ui/MediaComponents';

import { MEDIA_STATUSES, MEDIA_TYPES } from '../model/media-view.utils';
import { useParticipantMediaView } from '../model/useParticipantMediaView';
import { MediaHistoryCard } from './MediaHistoryCard';
import { MediaUploadCard } from './MediaUploadCard';

export function ParticipantMedia() {
  const view = useParticipantMediaView();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Media</h1>
        <p className="text-sm text-muted-foreground">Upload event media and track moderation status.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(360px,440px)_1fr]">
        <MediaUploadCard
          selectedEventId={view.selectedEventId}
          title={view.title}
          setTitle={view.setTitle}
          description={view.description}
          setDescription={view.setDescription}
          tags={view.tags}
          setTags={view.setTags}
          handleFileChange={view.handleFileChange}
          file={view.file}
          previewUrl={view.previewUrl}
          fileError={view.fileError}
          uploadPending={view.uploadMutation.isPending}
          uploadProgress={view.uploadProgress}
          onSubmit={view.handleUpload}
        />

        <MediaHistoryCard
          mediaTypes={MEDIA_TYPES}
          mediaStatuses={MEDIA_STATUSES}
          historyType={view.historyType}
          setHistoryType={view.setHistoryType}
          historyStatus={view.historyStatus}
          setHistoryStatus={view.setHistoryStatus}
          fromDate={view.fromDate}
          setFromDate={view.setFromDate}
          toDate={view.toDate}
          setToDate={view.setToDate}
          week={view.week}
          setWeek={view.setWeek}
          month={view.month}
          setMonth={view.setMonth}
          year={view.year}
          setYear={view.setYear}
          page={view.page}
          setPage={view.setPage}
          historyLoading={view.historyQuery.isLoading}
          historyItems={view.historyItems}
          pagination={view.pagination}
          onView={view.handleOpenMedia}
          onDelete={(media) => view.setDeleteMedia(media)}
        />
      </div>

      <MediaViewModal
        media={view.viewMedia}
        signedUrl={view.signedUrl}
        loading={view.viewMutation.isPending}
        open={Boolean(view.viewMedia)}
        onOpenChange={(open) => {
          if (!open) {
            view.setViewMedia(null);
            view.setSignedUrl(null);
          }
        }}
      />

      <AlertDialog open={Boolean(view.deleteMedia)} onOpenChange={(open) => !open && view.setDeleteMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              You can delete pending uploads before they are reviewed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {view.deleteMedia && !view.canDelete(view.deleteMedia) && (
            <p className="text-sm text-red-600">Only your own pending uploads can be deleted.</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!view.deleteMedia || !view.canDelete(view.deleteMedia) || view.deleteMutation.isPending}
              onClick={() => view.deleteMedia && view.deleteMutation.mutate(view.deleteMedia.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
