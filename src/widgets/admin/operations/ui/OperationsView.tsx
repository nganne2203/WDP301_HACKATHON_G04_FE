import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, GitBranch, Loader2, Server, Webhook } from 'lucide-react';

import { operationsApi } from '@/entities/operations/api';
import { eventsApi } from '@/entities/event/api';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

function MetricCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function OperationsView() {
  const [selectedEventId, setSelectedEventId] = useState('');

  const eventsQuery = useQuery({
    queryKey: ['ops-events'],
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
  });
  const events = eventsQuery.data || [];
  const activeEventId = selectedEventId || events[0]?.id || '';

  const dashboardQuery = useQuery({
    queryKey: ['ops-dashboard', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: async () => (await operationsApi.getDashboardMetrics({ eventId: activeEventId })).data,
  });

  const pipelineQuery = useQuery({
    queryKey: ['ops-pipeline', activeEventId],
    enabled: Boolean(activeEventId),
    queryFn: async () => (await operationsApi.getPipelineSummary({ eventId: activeEventId })).data,
  });

  const metrics = dashboardQuery.data;
  const pipeline = pipelineQuery.data || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
          <Server className="h-6 w-6" />
          Operations Console
        </h1>
        <p className="text-sm text-muted-foreground">
          Repository pipeline health, AI review status, and job monitoring.
        </p>
      </div>

      {/* Event selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="max-w-sm space-y-2">
            <Label>Event scope</Label>
            {eventsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading events…</p>
            ) : (
              <Select value={selectedEventId || activeEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard metrics */}
      {dashboardQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading metrics…</AlertTitle>
          <AlertDescription>Fetching operational data from the backend.</AlertDescription>
        </Alert>
      ) : metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={GitBranch} label="Active Repositories" value={metrics.activeRepositories ?? metrics.totalRepositories ?? '–'} />
          <MetricCard icon={Webhook} label="Webhooks Registered" value={metrics.webhooksRegistered ?? '–'} sub={metrics.webhooksFailed ? `${metrics.webhooksFailed} failed` : undefined} />
          <MetricCard icon={Bot} label="AI Reviews Done" value={metrics.aiReviewsCompleted ?? '–'} sub={metrics.aiReviewsPending ? `${metrics.aiReviewsPending} pending` : undefined} />
          <MetricCard icon={Server} label="Failed Jobs" value={metrics.failedJobs ?? '–'} />
        </div>
      ) : !activeEventId ? (
        <Alert>
          <Server className="h-4 w-4" />
          <AlertTitle>Select an event to view metrics</AlertTitle>
          <AlertDescription>Choose an event above to see operational dashboard metrics.</AlertDescription>
        </Alert>
      ) : null}

      {/* Pipeline summary table */}
      <Card>
        <CardHeader>
          <CardTitle>Repository Pipeline Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {pipelineQuery.isLoading ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Loading pipeline data…</AlertTitle>
            </Alert>
          ) : pipeline.length === 0 ? (
            <Alert>
              <GitBranch className="h-4 w-4" />
              <AlertTitle>No pipeline data</AlertTitle>
              <AlertDescription>No repositories are connected to this event yet.</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Last AI Review</TableHead>
                  <TableHead>Errors / Warnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipeline.map((item) => (
                  <TableRow key={item.repositoryId}>
                    <TableCell>
                      <p className="font-mono text-sm">{item.repositoryFullName}</p>
                    </TableCell>
                    <TableCell>{item.teamName || '–'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.lastSync ? new Date(item.lastSync).toLocaleString() : '–'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.lastAiReview ? new Date(item.lastAiReview).toLocaleString() : '–'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {(item.errorCount ?? 0) > 0 && (
                          <Badge variant="destructive">{item.errorCount} errors</Badge>
                        )}
                        {(item.warningCount ?? 0) > 0 && (
                          <Badge variant="outline">{item.warningCount} warnings</Badge>
                        )}
                        {!item.errorCount && !item.warningCount && (
                          <Badge variant="secondary">Clean</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
