import {
  Download,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  Trash2,
  Video,
  XCircle,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import type { MediaItem, MediaStatus, MediaType } from '../../../lib/api/types';

const TYPE_META: Record<MediaType, { label: string; icon: typeof ImageIcon; className: string }> = {
  IMAGE: { label: 'Image', icon: ImageIcon, className: 'bg-sky-50 text-sky-700 border-sky-200' },
  VIDEO: { label: 'Video', icon: Video, className: 'bg-violet-50 text-violet-700 border-violet-200' },
  DOCUMENT: { label: 'Document', icon: FileText, className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const STATUS_META: Record<MediaStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export function formatFileSize(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString();
}

export function MediaTypeBadge({ type }: { type: MediaType }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;

  return (
    <Badge variant="outline" className={meta.className}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </Badge>
  );
}

export function MediaStatusBadge({ status }: { status: MediaStatus }) {
  const meta = STATUS_META[status];

  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}

export function MediaPreview({ file, previewUrl }: { file: File | null; previewUrl: string | null }) {
  if (!file) {
    return (
      <div className="flex h-44 items-center justify-center rounded-md border border-dashed bg-gray-50 text-sm text-muted-foreground">
        Select a file to preview it here.
      </div>
    );
  }

  const isImage = file.type.startsWith('image/') && previewUrl;
  const isVideo = file.type.startsWith('video/') && previewUrl;

  return (
    <div className="rounded-md border bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        <Badge variant="secondary">{file.type || 'Unknown type'}</Badge>
      </div>
      {isImage && (
        <img
          src={previewUrl}
          alt={file.name}
          className="h-56 w-full rounded-md object-cover"
        />
      )}
      {isVideo && (
        <video
          src={previewUrl}
          controls
          className="h-56 w-full rounded-md bg-black object-contain"
        />
      )}
      {!isImage && !isVideo && (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md bg-gray-50 text-muted-foreground">
          <FileText className="w-10 h-10" />
          <span className="text-sm">{file.name}</span>
        </div>
      )}
    </div>
  );
}

export function MediaCard({
  media,
  onView,
  onDelete,
}: {
  media: MediaItem;
  onView: (media: MediaItem) => void;
  onDelete?: (media: MediaItem) => void;
}) {
  const meta = TYPE_META[media.mediaType];
  const Icon = meta.icon;

  return (
    <Card className="overflow-hidden rounded-lg">
      <div className="flex h-36 items-center justify-center bg-gray-100">
        <Icon className="w-12 h-12 text-gray-500" />
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-sm font-semibold">
              {media.title || media.originalFileName}
            </h3>
            <MediaTypeBadge type={media.mediaType} />
          </div>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {media.description || media.originalFileName}
          </p>
        </div>
        {media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {media.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[11px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(media.fileSize)}</span>
          <span>{formatDate(media.uploadedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1" onClick={() => onView(media)}>
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          {onDelete && (
            <Button size="icon" variant="outline" onClick={() => onDelete(media)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MediaHistoryTable({
  items,
  onView,
  onDelete,
  onApprove,
  onReject,
  admin = false,
}: {
  items: MediaItem[];
  onView: (media: MediaItem) => void;
  onDelete?: (media: MediaItem) => void;
  onApprove?: (media: MediaItem) => void;
  onReject?: (media: MediaItem) => void;
  admin?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Media</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          {admin && <TableHead>Uploader</TableHead>}
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={admin ? 6 : 5} className="h-24 text-center text-muted-foreground">
              No media found.
            </TableCell>
          </TableRow>
        ) : (
          items.map((media) => (
            <TableRow key={media.id}>
              <TableCell className="max-w-[260px]">
                <div className="min-w-0">
                  <p className="truncate font-medium">{media.title || media.originalFileName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {media.originalFileName} · {formatFileSize(media.fileSize)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <MediaTypeBadge type={media.mediaType} />
              </TableCell>
              <TableCell>
                <MediaStatusBadge status={media.status} />
              </TableCell>
              {admin && (
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{media.uploadedBy?.fullName || media.uploadedById || '-'}</p>
                    <p className="truncate text-xs text-muted-foreground">{media.uploadedBy?.email || ''}</p>
                  </div>
                </TableCell>
              )}
              <TableCell>{formatDate(media.uploadedAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="outline" onClick={() => onView(media)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {onApprove && media.status !== 'APPROVED' && (
                    <Button size="sm" variant="outline" onClick={() => onApprove(media)}>
                      Approve
                    </Button>
                  )}
                  {onReject && media.status !== 'REJECTED' && (
                    <Button size="sm" variant="outline" onClick={() => onReject(media)}>
                      Reject
                    </Button>
                  )}
                  {onDelete && (
                    <Button size="icon" variant="outline" onClick={() => onDelete(media)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function MediaViewModal({
  media,
  signedUrl,
  loading,
  open,
  onOpenChange,
}: {
  media: MediaItem | null;
  signedUrl: string | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{media?.title || media?.originalFileName || 'Media preview'}</DialogTitle>
          <DialogDescription>
            Signed access refreshes when this viewer opens.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-72">
          {loading && (
            <div className="flex h-72 items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading signed URL...
            </div>
          )}
          {!loading && media && signedUrl && media.mediaType === 'IMAGE' && (
            <img src={signedUrl} alt={media.title || media.originalFileName} className="max-h-[70vh] w-full rounded-md object-contain" />
          )}
          {!loading && media && signedUrl && media.mediaType === 'VIDEO' && (
            <video src={signedUrl} controls className="max-h-[70vh] w-full rounded-md bg-black" />
          )}
          {!loading && media && signedUrl && media.mediaType === 'DOCUMENT' && (
            <div className="flex h-72 flex-col items-center justify-center gap-4 rounded-md bg-gray-50">
              <FileText className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{media.originalFileName}</p>
              <Button asChild>
                <a href={signedUrl} target="_blank" rel="noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  Open document
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RejectMediaModal({
  media,
  reason,
  loading,
  open,
  onReasonChange,
  onOpenChange,
  onConfirm,
}: {
  media: MediaItem | null;
  reason: string;
  loading: boolean;
  open: boolean;
  onReasonChange: (reason: string) => void;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Media</DialogTitle>
          <DialogDescription>
            Provide a short reason for rejecting {media?.title || media?.originalFileName || 'this media item'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Reason for rejection"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading || !reason.trim()}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MediaStatisticsCards({
  totalUploads,
  pending,
  approved,
  rejected,
  totalImages,
  totalVideos,
  totalDocuments,
}: {
  totalUploads: number;
  pending: number;
  approved: number;
  rejected: number;
  totalImages?: number;
  totalVideos?: number;
  totalDocuments?: number;
}) {
  const cards = [
    { label: 'Total uploads', value: totalUploads },
    { label: 'Images', value: totalImages ?? 0 },
    { label: 'Videos', value: totalVideos ?? 0 },
    { label: 'Documents', value: totalDocuments ?? 0 },
    { label: 'Pending', value: pending },
    { label: 'Approved', value: approved },
    { label: 'Rejected', value: rejected },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-white p-4">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export function DeleteMediaIcon() {
  return <XCircle className="w-4 h-4" />;
}
