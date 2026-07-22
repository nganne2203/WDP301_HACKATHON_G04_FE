import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Download, Eye, FileSpreadsheet, Loader2, Search } from 'lucide-react';

import { auditApi } from '@/entities/audit/api';
import { queryKeys } from '@/lib/queryKeys';
import type { AuditLog, ListAuditLogsQuery } from '@/shared/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  CREATED: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  UPDATED: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  DELETED: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  FAILED: 'bg-red-100 text-red-800',
  PUBLISH: 'bg-yellow-100 text-yellow-800',
};

const RESULT_OPTIONS = [
  { label: 'All results', value: 'all' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Failure', value: 'FAILURE' },
] as const;

const ROLE_OPTIONS = [
  { label: 'All roles', value: 'all' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Coordinator', value: 'COORDINATOR' },
  { label: 'Competition Coordinator', value: 'COMPETITION_COORDINATOR' },
  { label: 'Judge', value: 'JUDGE' },
  { label: 'Mentor', value: 'MENTOR' },
  { label: 'Speaker', value: 'SPEAKER' },
  { label: 'Participant', value: 'PARTICIPANT' },
] as const;

const ENTITY_OPTIONS = [
  { label: 'All entities', value: 'all' },
  { label: 'Auth', value: 'Auth' },
  { label: 'User', value: 'User' },
  { label: 'Role', value: 'Role' },
  { label: 'Permission', value: 'Permission' },
  { label: 'Team', value: 'Team' },
  { label: 'Team Invitation', value: 'TeamInvitation' },
  { label: 'Competition', value: 'Competition' },
  { label: 'Round', value: 'Round' },
  { label: 'Rubric', value: 'Rubric' },
  { label: 'Criterion', value: 'Criterion' },
  { label: 'Submission', value: 'Submission' },
  { label: 'Score Sheet', value: 'ScoreSheet' },
  { label: 'Ranking', value: 'Ranking' },
  { label: 'Finalist', value: 'Finalist' },
  { label: 'AI Review', value: 'AiReview' },
  { label: 'Repository', value: 'Repository' },
  { label: 'GitHub', value: 'GitHub' },
  { label: 'Media', value: 'Media' },
  { label: 'Notification', value: 'Notification' },
  { label: 'Workshop', value: 'Workshop' },
  { label: 'System', value: 'System' },
  { label: 'System Configuration', value: 'SystemConfiguration' },
] as const;

function getActionColor(action: string): string {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.toUpperCase().includes(key)) return ACTION_COLORS[key];
  }
  return 'bg-gray-100 text-gray-800';
}

function getResultBadgeClass(result?: string | null): string {
  const normalized = result || 'SUCCESS';
  if (normalized === 'SUCCESS') return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-50';
  return '';
}

function getActorName(log: AuditLog) {
  return log.user?.fullName?.trim() || log.username || log.user?.email || (log.userId ? 'Unknown user' : 'System');
}

function getActorEmail(log: AuditLog) {
  return log.user?.email || (log.username?.includes('@') ? log.username : '') || '-';
}

function shorten(value?: string | null, maxLength = 88) {
  const text = value?.trim() || '-';
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '-';
}

function stringify(value: unknown) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="w-full max-w-full whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs [overflow-wrap:anywhere] max-h-80 overflow-y-auto">
      {stringify(value)}
    </pre>
  );
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildExportRows(logs: AuditLog[]) {
  return logs.map((log) => ({
    auditId: log.auditId || log.id,
    createdAt: log.createdAt,
    user: getActorName(log),
    userRole: log.userRole || '',
    action: log.action || '',
    result: log.result || '',
    entityType: log.entityType || log.resourceType || '',
    entityId: log.entityId || log.resourceId || '',
    ipAddress: log.ipAddress || '',
    requestId: log.requestId || '',
    sourceModule: log.sourceModule || '',
    description: log.description || '',
    errorMessage: log.errorMessage || '',
  }));
}

function AuditDetailsDialog({
  log,
  onClose,
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(log)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="!w-[min(760px,calc(100vw-2rem))] !max-w-none sm:!max-w-none max-h-[85vh] overflow-y-auto overflow-x-hidden p-0">
        <DialogHeader className="px-6 pt-6 pr-14">
          <DialogTitle>Audit Competition Details</DialogTitle>
        </DialogHeader>
        {log && (
          <div className="space-y-5 px-6 pb-6 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
              <div className="min-w-0">
                <p className="text-muted-foreground">Audit ID</p>
                <p className="font-mono text-xs break-all">{log.auditId || log.id}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">Request ID</p>
                <p className="font-mono text-xs break-all">{log.requestId || '-'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">Session ID</p>
                <p className="font-mono text-xs break-all">{log.sessionId || '-'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">IP Address</p>
                <p>{log.ipAddress || '-'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">User</p>
                <p className="truncate font-medium" title={getActorName(log)}>{getActorName(log)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">Email</p>
                <p className="truncate" title={getActorEmail(log)}>{getActorEmail(log)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">Source</p>
                <p>{log.sourceModule || '-'}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground">Result</p>
                <Badge
                  className={`max-w-full truncate ${getResultBadgeClass(log.result)}`}
                  variant={log.result === 'FAILURE' ? 'destructive' : 'outline'}
                >
                  {log.result || 'SUCCESS'}
                </Badge>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-sm">{log.description || '-'}</p>
              {log.errorMessage && <p className="text-sm text-destructive mt-1">{log.errorMessage}</p>}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium mb-2">Old Value</p>
                <JsonBlock value={log.oldValue} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium mb-2">New Value</p>
                <JsonBlock value={log.newValue} />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium mb-2">Metadata</p>
              <JsonBlock value={log.metadata} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogsView() {
  const [filters, setFilters] = useState<ListAuditLogsQuery>({
    page: 1,
    limit: 20,
    result: '',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const query = useMemo(() => {
    const { action, sourceModule, ...visibleFilters } = filters;
    void action;
    void sourceModule;

    return {
      ...visibleFilters,
      result: filters.result || undefined,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
  }, [filters]);

  const summaryQueryParams = useMemo(() => {
    const { page, limit, ...summaryFilters } = query;
    void page;
    void limit;
    return summaryFilters;
  }, [query]);

  const logsQuery = useQuery({
    queryKey: queryKeys.auditLogs.list(query),
    queryFn: async () => auditApi.list(query),
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.auditLogs.summary(summaryQueryParams),
    queryFn: async () => auditApi.getSummary(summaryQueryParams),
  });

  const logs = Array.isArray(logsQuery.data?.data) ? logsQuery.data.data : [];
  const pagination = logsQuery.data?.pagination || null;
  const summary = summaryQuery.data?.data;
  const totalItems = summary?.totalItems ?? summary?.totalLogs ?? 0;
  const actionBreakdown = summary?.actionBreakdown ?? summary?.byAction ?? [];
  const resultBreakdown = summary?.resultBreakdown ?? [];
  const updateFilter = (key: keyof ListAuditLogsQuery, value: string) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20, result: '', userRole: '' });
  };

  const exportCsv = () => {
    const rows = buildExportRows(logs);
    const headers = Object.keys(rows[0] || { auditId: '', createdAt: '', user: '', action: '' });
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => `"${String(row[header as keyof typeof row] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    downloadFile('audit-logs.csv', csv, 'text/csv;charset=utf-8');
  };

  const exportExcel = () => {
    const rows = buildExportRows(logs);
    const headers = Object.keys(rows[0] || { auditId: '', createdAt: '', user: '', action: '' });
    const table = [
      '<table><thead><tr>',
      ...headers.map((header) => `<th>${header}</th>`),
      '</tr></thead><tbody>',
      ...rows.map((row) => `<tr>${headers.map((header) => `<td>${String(row[header as keyof typeof row] ?? '')}</td>`).join('')}</tr>`),
      '</tbody></table>',
    ].join('');
    downloadFile('audit-logs.xls', table, 'application/vnd.ms-excel;charset=utf-8');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground">
            Review account activity, security competitions, and system changes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={logs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportExcel} disabled={logs.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {summaryQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading summary...
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Competitions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
            </CardContent>
          </Card>
          {resultBreakdown.slice(0, 2).map((item) => (
            <Card key={item.result || 'unknown'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.result || 'UNKNOWN'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{item.count.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
          {actionBreakdown.slice(0, 2).map((item) => (
            <Card key={item.action}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground truncate">{item.action}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{item.count.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audit-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="audit-search" className="pl-9" placeholder="User, request id, entity..." value={filters.search || ''} onChange={(competition) => updateFilter('search', competition.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-filter">User</Label>
              <Input id="user-filter" placeholder="Email or username" value={filters.username || ''} onChange={(competition) => updateFilter('username', competition.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={filters.userRole || 'all'} onValueChange={(value) => updateFilter('userRole', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entity</Label>
              <Select value={filters.resourceType || 'all'} onValueChange={(value) => updateFilter('resourceType', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Select value={filters.result || 'all'} onValueChange={(value) => updateFilter('result', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-filter">From</Label>
              <Input id="from-filter" type="date" value={filters.from || ''} onChange={(competition) => updateFilter('from', competition.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-filter">To</Label>
              <Input id="to-filter" type="date" value={filters.to || ''} onChange={(competition) => updateFilter('to', competition.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Log Entries</span>
            {pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                {(pagination.totalItems ?? 0).toLocaleString()} total, page {pagination.currentPage ?? 1} of {pagination.totalPages ?? 1}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Loading audit logs...</AlertTitle>
              <AlertDescription>Loading activity logs.</AlertDescription>
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
                  <TableHead>Entity</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead className="w-[64px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell className="max-w-[180px]">
                      <div className="min-w-0" title={getActorName(log)}>
                        <p className="truncate text-sm font-medium">{getActorName(log)}</p>
                        {/* <p className="text-xs text-muted-foreground">{log.userRole || log.userId || ''}</p> */}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <Badge variant="outline" className={getActionColor(log.action ?? '')}>{shorten(log.action, 32)}</Badge>
                      {log.description && (
                        <p className="mt-1 truncate text-xs text-muted-foreground" title={log.description}>
                          {shorten(log.description, 58)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <div className="min-w-0">
                        <Badge variant="secondary" className="text-xs">{log.entityType || log.resourceType || '-'}</Badge>
                        {(log.entityId || log.resourceId) && (
                          <p className="mt-1 truncate font-mono text-xs text-muted-foreground" title={log.entityId || log.resourceId}>
                            {shorten(log.entityId || log.resourceId, 18)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <Badge
                        className={getResultBadgeClass(log.result)}
                        variant={log.result === 'FAILURE' ? 'destructive' : 'outline'}
                      >
                        {log.result || 'SUCCESS'}
                      </Badge>
                      {log.errorMessage && (
                        <p className="mt-1 truncate text-xs text-destructive" title={log.errorMessage}>
                          {shorten(log.errorMessage, 48)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[130px]">
                      <p className="truncate font-mono text-xs" title={log.requestId || '-'}>{shorten(log.requestId, 16)}</p>
                      <p className="truncate text-xs text-muted-foreground" title={log.ipAddress || ''}>{log.ipAddress || ''}</p>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)} aria-label="View audit details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination && (pagination.totalPages ?? 1) > 1 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={(filters.page || 1) <= 1} onClick={() => setFilters((current) => ({ ...current, page: (current.page || 1) - 1 }))}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {filters.page || 1} of {pagination.totalPages ?? 1}</span>
                <Button variant="outline" size="sm" disabled={(filters.page || 1) >= (pagination.totalPages ?? 1)} onClick={() => setFilters((current) => ({ ...current, page: (current.page || 1) + 1 }))}>
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AuditDetailsDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
