import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, GitBranch, Loader2, Server, Users, Webhook } from 'lucide-react';

import { operationsApi } from '@/entities/operations/api';
import { useEventsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import type { StatusCount } from '@/shared/api/types';

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

function StatusBreakdownTable({ title, rows }: { title: string; rows: StatusCount[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.status}>
                  <TableCell>
                    <Badge variant="outline">{row.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function OperationsView() {
  const [selectedEventId, setSelectedEventId] = useState('');

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];
  const activeEventId = selectedEventId || events[0]?.id || events[0]?._id || '';

  const dashboardQuery = useQuery({
    queryKey: queryKeys.operations.dashboard(activeEventId),
    enabled: Boolean(activeEventId),
    queryFn: async () => operationsApi.getDashboardMetrics({ eventId: activeEventId }),
  });

  const pipelineQuery = useQuery({
    queryKey: queryKeys.operations.pipeline(activeEventId),
    enabled: Boolean(activeEventId),
    queryFn: async () => operationsApi.getPipelineSummary({ eventId: activeEventId }),
  });

  // BE: { scope, metrics: { participants, teams, submissions, repositories, pendingAiReviews, failedJobs }, queue }
  const dashboardPayload = dashboardQuery.data?.data as any;
  const m = dashboardPayload?.metrics;
  const queue = dashboardPayload?.queue;

  // BE: { scope, queue, webhookStatusBreakdown, commitDiffStatusBreakdown, aiReviewStatusBreakdown }
  const pipelinePayload = pipelineQuery.data?.data as any;
  const webhookBreakdown: StatusCount[] = Array.isArray(pipelinePayload?.webhookStatusBreakdown)
    ? pipelinePayload.webhookStatusBreakdown
    : [];
  const commitBreakdown: StatusCount[] = Array.isArray(pipelinePayload?.commitDiffStatusBreakdown)
    ? pipelinePayload.commitDiffStatusBreakdown
    : [];
  const aiBreakdown: StatusCount[] = Array.isArray(pipelinePayload?.aiReviewStatusBreakdown)
    ? pipelinePayload.aiReviewStatusBreakdown
    : [];

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
                  {events.map((event: any) => (
                    <SelectItem key={event.id ?? event._id} value={event.id ?? event._id}>
                      {event.title ?? event.name}
                    </SelectItem>
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
      ) : m ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={GitBranch} label="Repositories" value={m.repositories ?? '–'} />
            <MetricCard icon={Users} label="Teams" value={m.teams ?? '–'} sub={`${m.participants ?? 0} participants`} />
            <MetricCard
              icon={Bot}
              label="Pending AI Reviews"
              value={m.pendingAiReviews ?? '–'}
              sub={m.fallbackAiReviews ? `${m.fallbackAiReviews} fallback` : undefined}
            />
            <MetricCard
              icon={Server}
              label="Failed Jobs"
              value={m.failedJobs ?? '–'}
              sub={queue ? `Queue: ${queue.redisStatus ?? '–'}` : undefined}
            />
          </div>

          {/* Queue detail */}
          {queue && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Queue Status — {queue.queueName ?? 'Unknown'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(queue.counts ?? {}).map(([key, val]) => (
                    <div key={key} className="flex flex-col items-center rounded-md border p-3 min-w-[80px]">
                      <span className="text-lg font-bold">{String(val)}</span>
                      <span className="text-xs text-muted-foreground capitalize">{key}</span>
                    </div>
                  ))}
                </div>
                {queue.error && (
                  <p className="mt-3 text-xs text-destructive">{queue.error}</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : !activeEventId ? (
        <Alert>
          <Server className="h-4 w-4" />
          <AlertTitle>Select an event to view metrics</AlertTitle>
          <AlertDescription>Choose an event above to see operational dashboard metrics.</AlertDescription>
        </Alert>
      ) : null}

      {/* Pipeline status breakdowns */}
      {pipelineQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading pipeline data…</AlertTitle>
        </Alert>
      ) : pipelinePayload ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusBreakdownTable title="Webhook Events" rows={webhookBreakdown} />
          <StatusBreakdownTable title="Commit Diffs" rows={commitBreakdown} />
          <StatusBreakdownTable title="AI Reviews" rows={aiBreakdown} />
        </div>
      ) : null}
    </div>
  );
}
