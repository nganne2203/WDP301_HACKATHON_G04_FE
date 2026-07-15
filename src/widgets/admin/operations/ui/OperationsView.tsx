import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot, GitBranch, Loader2, Server, Users, Webhook } from 'lucide-react';

import { operationsApi } from '@/entities/operations/api';
import { useStore } from '@/entities/session/model/store';
import { useEventsQuery, selectDefaultEvent } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
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
  const storeSelectedEvent = useStore((state) => state.selectedEvent);
  const setSelectedEvent = useStore((state) => state.setSelectedEvent);

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];

  // Sync ongoing/default event with store if not already set
  useEffect(() => {
    if (events.length > 0 && !storeSelectedEvent) {
      const defaultEvent = selectDefaultEvent(events) || events[0];
      setSelectedEvent({
        id: defaultEvent.id || (defaultEvent as any)._id,
        title: defaultEvent.title || (defaultEvent as any).name || '',
        semester: defaultEvent.semester || '',
        status: defaultEvent.status || '',
      });
    }
  }, [events, storeSelectedEvent, setSelectedEvent]);

  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    if (storeSelectedEvent) {
      return events.find((e) => (e.id || (e as any)._id) === storeSelectedEvent.id) || events[0];
    }
    return selectDefaultEvent(events) || events[0];
  }, [events, storeSelectedEvent]);

  const activeEventId = activeEvent ? (activeEvent.id || (activeEvent as any)._id) : '';

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

  // BE: { scope, metrics: { participants, teams, submissions, repositories, pendingAiReviews, failedAiReviews, retryPendingAiReviews, manualRedispatchRequiredAiReviews, failedJobs }, queue }
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
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <Server className="h-6 w-6" />
            Operations Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Repository pipeline health, AI review status, and job monitoring.
          </p>
        </div>
      </div>

      {/* Dashboard metrics */}
      {dashboardQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading metrics…</AlertTitle>
          <AlertDescription>Loading system activity.</AlertDescription>
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
              sub={[
                m.retryPendingAiReviews ? `${m.retryPendingAiReviews} retry pending` : null,
                m.manualRedispatchRequiredAiReviews ? `${m.manualRedispatchRequiredAiReviews} manual` : null,
                m.failedAiReviews ? `${m.failedAiReviews} failed` : null,
              ].filter(Boolean).join(' | ') || undefined}
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
          <AlertDescription>Choose an event in the header to see operational dashboard metrics.</AlertDescription>
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
