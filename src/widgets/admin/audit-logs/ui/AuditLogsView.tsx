import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2, Search } from 'lucide-react';

import { auditApi } from '@/entities/audit/api';
import { queryKeys } from '@/lib/queryKeys';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  PUBLISH: 'bg-yellow-100 text-yellow-800',
};

function getActionColor(action: string): string {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.toUpperCase().includes(key)) return ACTION_COLORS[key];
  }
  return 'bg-gray-100 text-gray-800';
}

export function AuditLogsView() {
  const [actionFilter, setActionFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const logsQuery = useQuery({
    queryKey: queryKeys.auditLogs.list({ action: actionFilter || undefined, resourceType: resourceTypeFilter || undefined, page }),
    queryFn: async () =>
      auditApi.list({
        page,
        limit: 20,
        action: actionFilter || undefined,
        resourceType: resourceTypeFilter || undefined,
      }),
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.auditLogs.summary({ action: actionFilter || undefined, resourceType: resourceTypeFilter || undefined }),
    queryFn: async () =>
      auditApi.getSummary({
        action: actionFilter || undefined,
        resourceType: resourceTypeFilter || undefined,
      }),
  });

  // BE returns { auditLogs, pagination } inside .data
  const responseData = logsQuery.data?.data as any;
  const logs: any[] = responseData?.auditLogs || responseData || [];
  const pagination = responseData?.pagination || logsQuery.data?.pagination || null;

  // BE returns { totalItems, actionBreakdown, resourceBreakdown }
  const summary = summaryQuery.data?.data as any;
  const totalItems: number = summary?.totalItems ?? 0;
  const actionBreakdown: Array<{ status?: string; action?: string; count: number }> =
    summary?.actionBreakdown ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Full chronological log of all admin and coordinator actions in the system.
        </p>
      </div>

      {/* Summary cards */}
      {summaryQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading summary…
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
            </CardContent>
          </Card>
          {actionBreakdown.slice(0, 3).map((item, i) => (
            <Card key={item.action ?? item.status ?? i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.action ?? item.status ?? '–'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(item.count ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="action-filter">Action filter</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="action-filter"
                  className="pl-9"
                  placeholder="e.g. LOGIN, CREATE_EVENT…"
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="resource-filter">Resource type filter</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resource-filter"
                  className="pl-9"
                  placeholder="e.g. Event, Team, User…"
                  value={resourceTypeFilter}
                  onChange={(e) => { setResourceTypeFilter(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setActionFilter(''); setResourceTypeFilter(''); setPage(1); }}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Log Entries</span>
            {pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                {(pagination.totalItems ?? 0).toLocaleString()} total · page {pagination.currentPage ?? 1} of {pagination.totalPages ?? 1}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Loading audit logs…</AlertTitle>
              <AlertDescription>Fetching records from the backend.</AlertDescription>
            </Alert>
          ) : logs.length === 0 ? (
            <Alert>
              <ClipboardList className="h-4 w-4" />
              <AlertTitle>No audit logs found</AlertTitle>
              <AlertDescription>Try adjusting the filters or check back later.</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id ?? log._id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '–'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{log.user?.fullName ?? log.userId ?? '–'}</p>
                        <p className="text-xs text-muted-foreground">{log.user?.email ?? ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action ?? '')}>
                        {log.action ?? '–'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        {log.resourceType && (
                          <Badge variant="secondary" className="text-xs">{log.resourceType}</Badge>
                        )}
                        {log.resourceId && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">{log.resourceId}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.ipAddress ?? '–'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination && (pagination.totalPages ?? 1) > 1 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.totalPages ?? 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= (pagination.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
