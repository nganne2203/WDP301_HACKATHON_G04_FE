import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router';
import { AlertCircle, Loader2, UploadCloud } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { Textarea } from '@/shared/ui/textarea';
import { MediaPreview } from '@/widgets/media/ui/MediaComponents';

export function MediaUploadCard({
  selectedCompetitionId,
  title,
  setTitle,
  description,
  setDescription,
  tags,
  setTags,
  handleFileChange,
  file,
  previewUrl,
  fileError,
  uploadPending,
  uploadProgress,
  onSubmit,
}: {
  selectedCompetitionId: string;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;
  handleFileChange: (competition: ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
  previewUrl: string | null;
  fileError: string | null;
  uploadPending: boolean;
  uploadProgress: number;
  onSubmit: (competition: FormEvent) => void;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Upload Media</CardTitle>
        <CardDescription>Images, videos, and documents are reviewed before appearing in the gallery.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {selectedCompetitionId ? (
            <Button asChild variant="outline">
              <Link to={`/competitions/${selectedCompetitionId}/gallery`}>Open Gallery</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Open Gallery
            </Button>
          )}

          <div className="space-y-2">
            <Label htmlFor="media-title">Title</Label>
            <Input id="media-title" value={title} onChange={(competition) => setTitle(competition.target.value)} maxLength={200} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-description">Description</Label>
            <Textarea id="media-description" value={description} onChange={(competition) => setDescription(competition.target.value)} maxLength={2000} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-tags">Tags</Label>
            <Input id="media-tags" value={tags} onChange={(competition) => setTags(competition.target.value)} placeholder="team, demo, awards" />
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

          {uploadPending && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={uploadPending || Boolean(fileError)}>
            {uploadPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
            Upload
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
