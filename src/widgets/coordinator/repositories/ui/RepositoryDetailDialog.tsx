import { useQuery } from '@tanstack/react-query';
import { Bot, Github, Loader2 } from 'lucide-react';

import { repositoriesApi } from '@/entities/repository/api';
import type { Repository } from '@/shared/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { formatDate, shortSha, webhookVariant } from '../model/repository-view.utils';

export function RepositoryDetailDialog({
  repository,
  open,
  onClose,
}: {
  repository: Repository | null;
  open: boolean;
  onClose: () => void;
}) {
  const commitsQuery = useQuery({
    queryKey: ['repository-commits', repository?.id],
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listCommits(repository!.id, 1, 10)).data,
  });

  const diffQuery = useQuery({
    queryKey: ['repository-diffs', repository?.id],
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listCommitDiffs(repository!.id, 1, 5)).data,
  });

  const analysisQuery = useQuery({
    queryKey: ['repository-analysis', repository?.id],
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listStaticAnalysis(repository!.id, 1, 5)).data,
  });

  const impactQuery = useQuery({
    queryKey: ['repository-impact', repository?.id],
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listImpactDecisions(repository!.id, 1, 5)).data,
  });

  const reviewsQuery = useQuery({
    queryKey: ['repository-ai-reviews', repository?.id],
    enabled: open && Boolean(repository?.id),
    queryFn: async () => (await repositoriesApi.listAiReviews(repository!.id, 1, 5)).data,
  });

  if (!repository) return null;

  const commits = commitsQuery.data || [];
  const diffs = diffQuery.data || [];
  const analyses = analysisQuery.data || [];
  const impacts = impactQuery.data || [];
  const aiReviews = reviewsQuery.data?.aiReviews || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            {repository.repositoryFullName}
          </DialogTitle>
          <DialogDescription>
            Theo dõi webhook, commit evidence, phân tích tĩnh và AI review của repository này.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Team</p>
            <p className="font-medium">{repository.team?.name || '-'}</p>
            <p className="text-xs text-muted-foreground">{repository.team?.projectName || 'Chưa có project name'}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Round</p>
            <p className="font-medium">{repository.round?.name || 'Chưa gắn round'}</p>
            <p className="text-xs text-muted-foreground">{repository.defaultBranch}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Latest commit</p>
            <p className="font-medium">{shortSha(repository.latestCommitSha)}</p>
            <p className="text-xs text-muted-foreground">Processed: {shortSha(repository.lastProcessedCommitSha)}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Webhook</p>
            <div className="mt-1">
              <Badge variant={webhookVariant(repository.webhookStatus)}>{repository.webhookStatus}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{formatDate(repository.webhookRegisteredAt)}</p>
          </div>
        </div>

        <Tabs defaultValue="commits" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="commits">Commits</TabsTrigger>
            <TabsTrigger value="diffs">Diffs</TabsTrigger>
            <TabsTrigger value="analysis">Static Analysis</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="ai">AI Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="commits" className="space-y-3 pt-3">
            {commitsQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Đang tải commit evidence</AlertTitle>
                <AlertDescription>Đang đọc danh sách commit mới nhất từ backend.</AlertDescription>
              </Alert>
            ) : commits.length === 0 ? (
              <Alert>
                <AlertTitle>Chưa có commit evidence</AlertTitle>
                <AlertDescription>Repository này chưa sync commit về hệ thống.</AlertDescription>
              </Alert>
            ) : (
              commits.map((commit) => (
                <div key={commit.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{commit.message || '(No commit message)'}</p>
                    <Badge variant="outline">{shortSha(commit.commitSha)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {commit.authorName || commit.authorUsername || 'Unknown'} • {formatDate(commit.timestamp)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    +{commit.linesAdded} / -{commit.linesRemoved} • {commit.filesChanged} files
                  </p>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="diffs" className="space-y-3 pt-3">
            {diffQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Đang tải diff evidence</AlertTitle>
                <AlertDescription>Backend đang trả về các diff mới nhất của repository.</AlertDescription>
              </Alert>
            ) : diffs.length === 0 ? (
              <Alert>
                <AlertTitle>Chưa có diff evidence</AlertTitle>
                <AlertDescription>Hãy sync commits hoặc đợi webhook xử lý thêm.</AlertDescription>
              </Alert>
            ) : (
              diffs.map((diff) => (
                <div key={diff.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {shortSha(diff.baseCommitSha)} → {shortSha(diff.headCommitSha)}
                    </p>
                    <Badge variant="outline">{diff.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {diff.patchSummary || `${diff.includedFiles} included / ${diff.excludedFiles} excluded`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {diff.files.slice(0, 5).map((file) => (
                      <Badge key={`${diff.id}-${file.filePath}`} variant="secondary">
                        {file.filePath}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-3 pt-3">
            {analysisQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Đang tải static analysis</AlertTitle>
                <AlertDescription>Đang đọc kết quả phân tích tĩnh gần nhất.</AlertDescription>
              </Alert>
            ) : analyses.length === 0 ? (
              <Alert>
                <AlertTitle>Chưa có static analysis</AlertTitle>
                <AlertDescription>Chưa có bản ghi phân tích nào cho repository này.</AlertDescription>
              </Alert>
            ) : (
              analyses.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{shortSha(item.commitSha)}</p>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Errors: {item.errorCount} • Warnings: {item.warningCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Source: {item.source || '-'}</p>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="impact" className="space-y-3 pt-3">
            {impactQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Đang tải impact decisions</AlertTitle>
                <AlertDescription>Đang đọc đánh giá mức độ ảnh hưởng của các commit.</AlertDescription>
              </Alert>
            ) : impacts.length === 0 ? (
              <Alert>
                <AlertTitle>Chưa có impact decision</AlertTitle>
                <AlertDescription>Chưa có dữ liệu impact cho repository này.</AlertDescription>
              </Alert>
            ) : (
              impacts.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{shortSha(item.commitSha)}</p>
                    <Badge variant={item.needsHumanReview ? 'destructive' : 'secondary'}>
                      {item.impactLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Decision: {item.decision} • Score: {item.impactScore}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.reasons.join(', ') || 'Không có reasons'}</p>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-3 pt-3">
            {reviewsQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Đang tải AI reviews</AlertTitle>
                <AlertDescription>Đang đọc lịch sử AI audit của repository.</AlertDescription>
              </Alert>
            ) : aiReviews.length === 0 ? (
              <Alert>
                <AlertTitle>Chưa có AI review</AlertTitle>
                <AlertDescription>Repository này chưa có per-push hoặc aggregate audit.</AlertDescription>
              </Alert>
            ) : (
              aiReviews.map((review) => (
                <div key={review.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{review.reviewKind}</p>
                    <Badge variant={review.needsHumanReview ? 'destructive' : 'secondary'}>
                      {review.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.summary || 'Chưa có summary.'}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.modelName || 'Unknown model'} • {formatDate(review.completedAt || review.requestedAt)}
                  </p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
