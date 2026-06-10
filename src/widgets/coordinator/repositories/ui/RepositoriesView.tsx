import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  Github,
  GitCommitHorizontal,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShieldX,
  UserPlus,
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ApiError } from '@/shared/api/client';
import { eventsApi } from '@/entities/event/api';
import { githubApi } from '@/entities/github/api';
import { repositoriesApi } from '@/entities/repository/api';
import { roundsApi } from '@/entities/round/api';
import { teamsApi } from '@/entities/team/api';
import type { Repository, RevokeGitHubMembersResult } from '@/shared/api/types';

const PERMISSIONS = ['pull', 'triage', 'push', 'maintain', 'admin'] as const;

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Could not connect to server.';
}

function accessVariant(state: Repository['accessState']) {
  if (state === 'GRANTED') return 'default' as const;
  if (state === 'PENDING') return 'secondary' as const;
  if (state === 'REVOKED') return 'destructive' as const;
  return 'outline' as const;
}

function webhookVariant(status: Repository['webhookStatus']) {
  if (status === 'REGISTERED') return 'default' as const;
  if (status === 'FAILED') return 'destructive' as const;
  if (status === 'PENDING') return 'secondary' as const;
  return 'outline' as const;
}

function statusVariant(status: Repository['status']) {
  if (status === 'ACTIVE') return 'default' as const;
  if (status === 'ARCHIVED') return 'secondary' as const;
  if (status === 'DISCONNECTED') return 'destructive' as const;
  return 'outline' as const;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}

function shortSha(value?: string | null) {
  return value ? value.slice(0, 8) : '-';
}

function RepositoryDetailDialog({
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

export function Repositories() {
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [ownerUsername, setOwnerUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [enabled, setEnabled] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('none');
  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [repoPrivate, setRepoPrivate] = useState(true);

  const [selectedRepositoryId, setSelectedRepositoryId] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null);
  const [collabRepoName, setCollabRepoName] = useState('');
  const [collabUsername, setCollabUsername] = useState('');
  const [collabPermission, setCollabPermission] = useState<typeof PERMISSIONS[number]>('push');

  const [inviteEmail, setInviteEmail] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [revokeResult, setRevokeResult] = useState<RevokeGitHubMembersResult | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['github-config-events'],
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
  });
  const events = eventsQuery.data || [];
  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return events.find((event) => event.id === selectedEventId) || events[0];
  }, [events, selectedEventId]);
  const activeEventId = activeEvent?.id || '';

  const configQuery = useQuery({
    queryKey: ['github-config', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: async () => (await githubApi.getConfig(activeEventId)).data,
  });

  const teamsQuery = useQuery({
    queryKey: ['repository-teams', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: async () => (await teamsApi.list({ eventId: activeEventId, limit: 100 })).data,
  });

  const roundsQuery = useQuery({
    queryKey: ['repository-rounds', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: async () => (await roundsApi.list({ eventId: activeEventId, limit: 100 })).data,
  });

  const repositoriesQuery = useQuery({
    queryKey: ['repositories', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: async () => (await repositoriesApi.list({ eventId: activeEventId, limit: 100 })).data,
  });

  const teams = teamsQuery.data || [];
  const rounds = roundsQuery.data || [];
  const repositories = repositoriesQuery.data || [];
  const selectedRepositorySummary = repositories.find((repository) => repository.id === selectedRepositoryId) || null;

  useEffect(() => {
    setOrganizationName('');
    setOwnerUsername('');
    setGithubToken('');
    setEnabled(false);
    setSelectedTeamId('');
    setSelectedRoundId('none');
    setSelectedRepositoryId('');
    setCollabRepoName('');
    setRevokeResult(null);
  }, [activeEventId]);

  useEffect(() => {
    if (!configQuery.data) return;
    setOrganizationName(configQuery.data.organizationName || '');
    setOwnerUsername(configQuery.data.ownerUsername || '');
    setEnabled(Boolean(configQuery.data.enabled));
  }, [configQuery.data]);

  useEffect(() => {
    if (!repositories.length) return;
    const preferred = repositories.find((item) => item.id === selectedRepositoryId) || repositories[0];
    setSelectedRepositoryId(preferred.id);
    setCollabRepoName((current) => current || preferred.githubRepo);
  }, [repositories, selectedRepositoryId]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.saveConfig({
        eventId: activeEventId,
        organizationName,
        ownerUsername,
        githubToken,
        enabled,
      })).data;
    },
    onSuccess: async () => {
      setGithubToken('');
      toast.success('GitHub configuration saved');
      await queryClient.invalidateQueries({ queryKey: ['github-config', activeEventId] });
    },
    onError: (error) => toast.error('Could not save GitHub configuration', { description: getApiErrorMessage(error) }),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.testConnection(activeEventId)).data;
    },
    onSuccess: (result) => {
      toast.success('GitHub connection works', {
        description: `${result.organizationName} is accessible.`,
      });
    },
    onError: (error) => toast.error('GitHub connection failed', { description: getApiErrorMessage(error) }),
  });

  const createRepositoryMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      if (!selectedTeamId) throw new Error('Please select a team first.');
      return (await githubApi.createRepository({
        eventId: activeEventId,
        teamId: selectedTeamId,
        roundId: selectedRoundId === 'none' ? null : selectedRoundId,
        repoName,
        description: repoDescription,
        private: repoPrivate,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Repository created', {
        description: result.htmlUrl || result.repoName,
      });
      setRepoName('');
      setRepoDescription('');
      setRepoPrivate(true);
      setCollabRepoName(result.repoName);
      await queryClient.invalidateQueries({ queryKey: ['repositories', activeEventId] });
    },
    onError: (error) => toast.error('Could not create repository', { description: getApiErrorMessage(error) }),
  });

  const assignCollaboratorMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.assignCollaborator(collabRepoName, collabUsername, {
        eventId: activeEventId,
        permission: collabPermission,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Collaborator assigned', {
        description: `${result.username} has ${result.permission} access to ${result.repoName}.`,
      });
      setCollabUsername('');
      await queryClient.invalidateQueries({ queryKey: ['repositories', activeEventId] });
    },
    onError: (error) => toast.error('Could not assign collaborator', { description: getApiErrorMessage(error) }),
  });

  const revokeCollaboratorMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.revokeCollaborator(collabRepoName, collabUsername, {
        eventId: activeEventId,
      })).data;
    },
    onSuccess: async (result) => {
      toast.success('Collaborator revoked', {
        description: `${result.username} was removed from ${result.repoName}.`,
      });
      setCollabUsername('');
      await queryClient.invalidateQueries({ queryKey: ['repositories', activeEventId] });
    },
    onError: (error) => toast.error('Could not revoke collaborator', { description: getApiErrorMessage(error) }),
  });

  const registerWebhookMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.registerRepositoryWebhook(collabRepoName, { eventId: activeEventId })).data;
    },
    onSuccess: async (result) => {
      toast.success('Webhook registered', {
        description: `${result.repoName} is now pointing to ${result.callbackUrl}.`,
      });
      await queryClient.invalidateQueries({ queryKey: ['repositories', activeEventId] });
    },
    onError: (error) => toast.error('Could not register webhook', { description: getApiErrorMessage(error) }),
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.inviteOrganizationMember({
        eventId: activeEventId,
        email: inviteEmail,
        role: 'direct_member',
      })).data;
    },
    onSuccess: (result) => {
      toast.success('Organization invitation sent', {
        description: result.email,
      });
      setInviteEmail('');
    },
    onError: (error) => toast.error('Could not invite organization member', { description: getApiErrorMessage(error) }),
  });

  const revokeMembersMutation = useMutation({
    mutationFn: async () => {
      if (!activeEventId) throw new Error('Please select an event first.');
      return (await githubApi.revokeMembers({
        eventId: activeEventId,
        confirmationText: 'REVOKE MEMBERS',
      })).data;
    },
    onSuccess: (result) => {
      setRevokeResult(result);
      setConfirmationText('');
      toast.success('Organization member revoke completed', {
        description: `${result.removed.length} removed, ${result.failed.length} failed.`,
      });
    },
    onError: (error) => toast.error('Could not revoke organization members', { description: getApiErrorMessage(error) }),
  });

  const syncRepositoryMutation = useMutation({
    mutationFn: (repositoryId: string) => repositoriesApi.syncCommits(repositoryId),
    onSuccess: async () => {
      toast.success('Sync commits requested');
      await queryClient.invalidateQueries({ queryKey: ['repositories', activeEventId] });
    },
    onError: (error) => toast.error('Could not sync commits', { description: getApiErrorMessage(error) }),
  });

  const analyzeRepositoryMutation = useMutation({
    mutationFn: (repositoryId: string) => repositoriesApi.analyzeCommit(repositoryId),
    onSuccess: () => toast.success('Analyze commit requested'),
    onError: (error) => toast.error('Could not request analysis', { description: getApiErrorMessage(error) }),
  });

  const triggerAiReviewMutation = useMutation({
    mutationFn: (repositoryId: string) => repositoriesApi.triggerTeamAggregateReview(repositoryId),
    onSuccess: () => toast.success('Team aggregate AI review requested'),
    onError: (error) => toast.error('Could not trigger AI review', { description: getApiErrorMessage(error) }),
  });

  const config = configQuery.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Repository Management</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý GitHub config, repository linkage, quyền truy cập và evidence pipeline theo từng event.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="w-full md:w-96 space-y-2">
            <Label>Event</Label>
            <Select value={activeEventId} onValueChange={setSelectedEventId} disabled={eventsQuery.isLoading}>
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
          </div>
        </CardContent>
      </Card>

      {configQuery.isLoading || eventsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading GitHub configuration</AlertTitle>
          <AlertDescription>Reading event-specific integration settings from the database.</AlertDescription>
        </Alert>
      ) : (
        <Alert className={config?.enabled ? 'bg-green-50 border-green-200' : undefined}>
          {config?.enabled ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Github className="h-4 w-4" />}
          <AlertTitle>{config?.enabled ? 'GitHub integration enabled' : 'GitHub integration disabled'}</AlertTitle>
          <AlertDescription>
            Organization: <strong>{config?.organizationName || 'Not configured'}</strong>
            {' '}• Token: <strong>{config?.hasToken ? 'Configured' : 'Missing'}</strong>
            {' '}• Event: <strong>{activeEvent?.title || 'No event selected'}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Config
            </CardTitle>
            <CardDescription>One encrypted `SystemConfiguration` record is stored for this event; saved tokens are never displayed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github-org">Organization name</Label>
                <Input
                  id="github-org"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  placeholder="your-org-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-owner">Owner username</Label>
                <Input
                  id="github-owner"
                  value={ownerUsername}
                  onChange={(event) => setOwnerUsername(event.target.value)}
                  placeholder="owner-github-username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github-token">GitHub token</Label>
              <Input
                id="github-token"
                type="password"
                value={githubToken}
                onChange={(event) => setGithubToken(event.target.value)}
                placeholder={config?.hasToken ? 'Leave blank to keep existing token' : 'github_pat_xxx'}
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={config?.hasToken ? 'default' : 'secondary'}>
                  {config?.hasToken ? 'Token exists' : 'No token saved'}
                </Badge>
                <span>Token value is never returned by the API.</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">Allow backend GitHub API operations.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => saveConfigMutation.mutate()}
                disabled={saveConfigMutation.isPending || !activeEventId}
              >
                {saveConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending || !config?.hasToken || !activeEventId}
              >
                {testConnectionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Test connection
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Repository
            </CardTitle>
            <CardDescription>Tạo repo GitHub và link luôn vào team của event hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Round</Label>
                <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional round" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No round</SelectItem>
                    {rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repo name</Label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(event) => setRepoName(event.target.value)}
                placeholder="team-alpha-project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-description">Description</Label>
              <Input
                id="repo-description"
                value={repoDescription}
                onChange={(event) => setRepoDescription(event.target.value)}
                placeholder="Repository for Team Alpha"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={repoPrivate} onCheckedChange={(checked) => setRepoPrivate(checked === true)} id="repo-private" />
              <Label htmlFor="repo-private">Private repository</Label>
            </div>
            <Button
              onClick={() => createRepositoryMutation.mutate()}
              disabled={createRepositoryMutation.isPending || !activeEventId || !selectedTeamId || !repoName}
            >
              {createRepositoryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create repository
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Linked Repositories</CardTitle>
            <CardDescription>
              Danh sách repository đã link với event, kèm trạng thái quyền truy cập, webhook và pipeline evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {repositoriesQuery.isLoading ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Loading repositories</AlertTitle>
                <AlertDescription>Đang đọc danh sách repository từ backend.</AlertDescription>
              </Alert>
            ) : repositories.length === 0 ? (
              <Alert>
                <AlertTitle>No repositories linked yet</AlertTitle>
                <AlertDescription>Tạo repository đầu tiên để bắt đầu pipeline GitHub cho event này.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {repositories.map((repository) => (
                  <div key={repository.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{repository.repositoryFullName}</p>
                          <Badge variant={statusVariant(repository.status)}>{repository.status}</Badge>
                          <Badge variant={accessVariant(repository.accessState)}>{repository.accessState}</Badge>
                          <Badge variant={webhookVariant(repository.webhookStatus)}>{repository.webhookStatus}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Team: {repository.team?.name || '-'} • Round: {repository.round?.name || 'Chưa gắn'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Latest: {shortSha(repository.latestCommitSha)} • Processed: {shortSha(repository.lastProcessedCommitSha)}
                        </p>
                        {repository.lastWebhookRegistrationError && (
                          <p className="text-xs text-destructive">{repository.lastWebhookRegistrationError}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a href={repository.repositoryUrl} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                        </a>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncRepositoryMutation.mutate(repository.id)}
                          disabled={syncRepositoryMutation.isPending}
                        >
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => analyzeRepositoryMutation.mutate(repository.id)}
                          disabled={analyzeRepositoryMutation.isPending}
                        >
                          <GitCommitHorizontal className="w-4 h-4 mr-2" />
                          Analyze
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerAiReviewMutation.mutate(repository.id)}
                          disabled={triggerAiReviewMutation.isPending}
                        >
                          <Bot className="w-4 h-4 mr-2" />
                          AI Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRepository(repository);
                            setSelectedRepositoryId(repository.id);
                            setCollabRepoName(repository.githubRepo);
                          }}
                        >
                          View details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Access + Webhook Actions
            </CardTitle>
            <CardDescription>Gán hoặc thu hồi collaborator, đồng thời đăng ký lại webhook khi cần.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Repository</Label>
              <Select
                value={collabRepoName}
                onValueChange={setCollabRepoName}
                disabled={repositories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select repository" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repository) => (
                    <SelectItem key={repository.id} value={repository.githubRepo}>
                      {repository.repositoryFullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="collab-user">GitHub username</Label>
                <Input
                  id="collab-user"
                  value={collabUsername}
                  onChange={(event) => setCollabUsername(event.target.value)}
                  placeholder="octocat"
                />
              </div>
              <div className="space-y-2">
                <Label>Permission</Label>
                <Select value={collabPermission} onValueChange={(value) => setCollabPermission(value as typeof PERMISSIONS[number])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSIONS.map((permission) => (
                      <SelectItem key={permission} value={permission}>{permission}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => assignCollaboratorMutation.mutate()}
                disabled={assignCollaboratorMutation.isPending || !activeEventId || !collabRepoName || !collabUsername}
              >
                {assignCollaboratorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Assign member
              </Button>
              <Button
                variant="outline"
                onClick={() => revokeCollaboratorMutation.mutate()}
                disabled={revokeCollaboratorMutation.isPending || !activeEventId || !collabRepoName || !collabUsername}
              >
                {revokeCollaboratorMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Revoke collaborator
              </Button>
              <Button
                variant="outline"
                onClick={() => registerWebhookMutation.mutate()}
                disabled={registerWebhookMutation.isPending || !activeEventId || !collabRepoName}
              >
                {registerWebhookMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Webhook className="w-4 h-4 mr-2" />
                )}
                Register webhook
              </Button>
            </div>
            {selectedRepositorySummary && (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">{selectedRepositorySummary.repositoryFullName}</p>
                <p className="text-muted-foreground mt-1">
                  Access: {selectedRepositorySummary.accessState} • Webhook: {selectedRepositorySummary.webhookStatus}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Organization Invitation
            </CardTitle>
            <CardDescription>Invite a member to the GitHub organization by email.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="member@gmail.com"
              />
            </div>
            <Button
              onClick={() => inviteMemberMutation.mutate()}
              disabled={inviteMemberMutation.isPending || !activeEventId}
            >
              {inviteMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Invite member
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldX className="w-5 h-5" />
            Organization Danger Zone
          </CardTitle>
          <CardDescription>Revoke every organization member except the configured owner username.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Destructive action</AlertTitle>
            <AlertDescription>
              This calls GitHub and removes organization members. It skips only the configured owner: {ownerUsername || 'not configured'}.
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <ShieldX className="w-4 h-4 mr-2" />
                Revoke all members except owner
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke organization members?</AlertDialogTitle>
                <AlertDialogDescription>
                  Type <strong>REVOKE MEMBERS</strong> to confirm. This operation continues even if one removal fails.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder="REVOKE MEMBERS"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmationText('')}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmationText !== 'REVOKE MEMBERS' || revokeMembersMutation.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    revokeMembersMutation.mutate();
                  }}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {revokeMembersMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm revoke
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {revokeResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Removed</p>
                <p className="text-2xl font-semibold">{revokeResult.removed.length}</p>
                <p className="text-xs text-muted-foreground break-words">{revokeResult.removed.join(', ') || 'None'}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Skipped</p>
                <p className="text-2xl font-semibold">{revokeResult.skipped.length}</p>
                <p className="text-xs text-muted-foreground break-words">{revokeResult.skipped.join(', ') || 'None'}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">Failed</p>
                <p className="text-2xl font-semibold">{revokeResult.failed.length}</p>
                <p className="text-xs text-muted-foreground break-words">
                  {revokeResult.failed.map((item) => `${item.username}: ${item.reason}`).join(', ') || 'None'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RepositoryDetailDialog
        repository={selectedRepository}
        open={Boolean(selectedRepository)}
        onClose={() => setSelectedRepository(null)}
      />
    </div>
  );
}
