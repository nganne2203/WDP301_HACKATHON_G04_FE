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
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { MediaViewModal, RejectMediaModal } from '@/widgets/media/ui/MediaComponents';

import { ADMIN_MEDIA_STATUSES, ADMIN_MEDIA_TYPES } from '../model/admin-media.utils';
import { useAdminMediaView } from '../model/useAdminMediaView';
import { AdminMediaFiltersCard } from './AdminMediaFiltersCard';
import { AdminMediaLeadersCard } from './AdminMediaLeadersCard';

export function AdminMedia() {
  const view = useAdminMediaView();

  if (!view.canManage) {
    return (
      <div className="p-6">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Media Management</CardTitle>
            <CardDescription>You need competition update permission to manage media.</CardDescription>
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

      <div className="space-y-6">
        <AdminMediaFiltersCard
          statisticsLoading={view.statisticsQuery.isLoading}
          statistics={view.statistics}
          mediaTypeCounts={view.mediaTypeCounts}
          mediaType={view.mediaType}
          setMediaType={view.setMediaType}
          status={view.status}
          setStatus={view.setStatus}
          fromDate={view.fromDate}
          setFromDate={view.setFromDate}
          toDate={view.toDate}
          setToDate={view.setToDate}
          mediaLoading={view.mediaQuery.isLoading}
          mediaItems={view.mediaItems}
          onView={view.handleOpenMedia}
          onApprove={(media) => view.approveMutation.mutate(media.id)}
          onReject={(media) => {
            view.setRejectMedia(media);
            view.setRejectReason('');
          }}
          onDelete={(media) => view.setDeleteMedia(media)}
          page={view.page}
          setPage={view.setPage}
          pagination={view.pagination}
          mediaTypes={ADMIN_MEDIA_TYPES}
          mediaStatuses={ADMIN_MEDIA_STATUSES}
          resetPage={view.resetPage}
        />

        <AdminMediaLeadersCard statistics={view.statistics} />
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

      <RejectMediaModal
        media={view.rejectMedia}
        reason={view.rejectReason}
        loading={view.rejectMutation.isPending}
        open={Boolean(view.rejectMedia)}
        onReasonChange={view.setRejectReason}
        onOpenChange={(open) => {
          if (!open) {
            view.setRejectMedia(null);
            view.setRejectReason('');
          }
        }}
        onConfirm={() => view.rejectMedia && view.rejectMutation.mutate({ mediaId: view.rejectMedia.id, reason: view.rejectReason.trim() })}
      />

      <AlertDialog open={Boolean(view.deleteMedia)} onOpenChange={(open) => !open && view.setDeleteMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {view.deleteMedia?.title || view.deleteMedia?.originalFileName || 'this item'}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!view.deleteMedia || view.deleteMutation.isPending}
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
