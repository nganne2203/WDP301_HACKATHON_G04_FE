import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Download, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { ListPagination } from '@/shared/ui/list-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';
import { participantsApi, workshopsApi } from '@/shared/api';
import { ApiError } from '@/shared/api/client';
import type { Participant, Workshop } from '@/shared/api/types';
import { useStore } from '@/entities/session/model/store';
import { useEventsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { EventCheckInQrPanel } from './EventCheckInQrPanel';

const EXPORT_PAGE_SIZE = 100;

function escapeExcelCell(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatExportDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalizeExportFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'event';
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

function buildAttendanceExcel(eventTitle: string, participants: Participant[]) {
  const headers = [
    'Participant',
    'Email',
    'Team',
    'Team Role',
    'Check-in Status',
    'Checked In At',
    'Participant Status',
    'Eligibility Status',
    'GitHub Access Status',
    'Joined At',
  ];
  const rows = participants.map((participant) => [
    participant.user?.fullName || '-',
    participant.user?.email || '-',
    participant.team?.name || 'No team',
    participant.teamRole || '',
    participant.checkInStatus === 'CHECKED_IN' ? 'Checked In' : 'Not Checked In',
    formatExportDate(participant.checkedInAt),
    participant.status || '',
    participant.eligibilityStatus || '',
    participant.githubAccessStatus || '',
    formatExportDate(participant.joinedAt),
  ]);
  const tableRows = [
    `<tr><th colspan="${headers.length}">Attendance List - ${escapeExcelCell(eventTitle)}</th></tr>`,
    `<tr><td colspan="${headers.length}">Exported at ${escapeExcelCell(new Date().toLocaleString())}</td></tr>`,
    `<tr>${headers.map((header) => `<th>${escapeExcelCell(header)}</th>`).join('')}</tr>`,
    ...rows.map((row) => `<tr>${row.map((value) => `<td>${escapeExcelCell(value)}</td>`).join('')}</tr>`),
  ].join('');

  return [
    '<html>',
    '<head><meta charset="UTF-8" /></head>',
    '<body>',
    '<table border="1">',
    tableRows,
    '</table>',
    '</body>',
    '</html>',
  ].join('');
}

export function Checkin() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((s) => s.selectedEvent);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const eventsQuery = useEventsQuery();
  const events = eventsQuery.data || [];

  const activeEvent = useMemo(() => {
    if (!events.length) return null;
    return (
      events.find((event) => event.id === selectedEventId) ||
      events.find((event) => event.id === selectedEvent?.id) ||
      events[0]
    );
  }, [events, selectedEventId, selectedEvent?.id]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setPage(1);
  };

  // Fetch real participants filtered by selected event
  const { data: participantsResponse, isLoading: participantsLoading, error: participantsError } = useQuery({
    queryKey: queryKeys.participants.list({ eventId: activeEvent?.id, page, limit: 10 }),
    queryFn: () => participantsApi.list({
      eventId: activeEvent?.id,
      page,
      limit: 10,
    }),
    enabled: Boolean(activeEvent?.id),
  });

  const { data: checkedInResponse } = useQuery({
    queryKey: queryKeys.participants.list({ eventId: activeEvent?.id, checkInStatus: 'CHECKED_IN', page: 1, limit: 10 }),
    queryFn: () => participantsApi.list({
      eventId: activeEvent?.id,
      checkInStatus: 'CHECKED_IN',
      page: 1,
      limit: 10,
    }),
    enabled: Boolean(activeEvent?.id),
  });

  const participants = participantsResponse?.data || [];
  const checkedInCount = checkedInResponse?.pagination?.totalItems || 0;
  const totalCount = participantsResponse?.pagination?.totalItems || 0;
  const checkinRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (id: string) => participantsApi.checkIn(id),
    onSuccess: () => {
      toast.success('Check-in successful');
      queryClient.invalidateQueries({ queryKey: queryKeys.participants.lists() });
    },
    onError: (error: unknown) => {
      toast.error('Check-in failed', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  // Fetch real workshops from backend
  const { data: workshopsResponse, isLoading: workshopsLoading, error: workshopsError } = useQuery({
    queryKey: queryKeys.workshops.list({ eventId: activeEvent?.id, page: 1, limit: 10 }),
    queryFn: () => workshopsApi.list({ eventId: activeEvent?.id, page: 1, limit: 10 }),
    enabled: Boolean(activeEvent?.id),
  });

  const workshops = workshopsResponse?.data || [];

  async function handleExportAttendance() {
    if (!activeEvent?.id) {
      toast.error('Select an event before exporting attendance.');
      return;
    }

    setIsExporting(true);
    try {
      const firstPage = await participantsApi.list({
        eventId: activeEvent.id,
        page: 1,
        limit: EXPORT_PAGE_SIZE,
      });
      const totalPages = firstPage.pagination?.totalPages || 1;
      const remainingPages = totalPages > 1
        ? await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) => participantsApi.list({
            eventId: activeEvent.id,
            page: index + 2,
            limit: EXPORT_PAGE_SIZE,
          }))
        )
        : [];
      const allParticipants = [
        ...(firstPage.data || []),
        ...remainingPages.flatMap((response) => response.data || []),
      ];

      if (allParticipants.length === 0) {
        toast.error('No attendance records to export.');
        return;
      }

      const content = buildAttendanceExcel(activeEvent.title, allParticipants);
      const eventSlug = normalizeExportFilename(activeEvent.title);
      const dateSlug = new Date().toISOString().slice(0, 10);
      downloadFile(
        `attendance-${eventSlug}-${dateSlug}.xls`,
        content,
        'application/vnd.ms-excel;charset=utf-8'
      );
      toast.success('Attendance exported', {
        description: `Exported ${allParticipants.length} participant(s) to Excel.`,
      });
    } catch (error) {
      toast.error('Could not export attendance', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Check-in & Seminar</h1>
          <p className="text-sm text-muted-foreground">
            Manage participant attendance and workshop sessions
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="w-full sm:w-80">
            <Select
              value={activeEvent?.id || ''}
              onValueChange={handleSelectEvent}
              disabled={eventsQuery.isLoading}
            >
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
        </div>
      </div>

      {!activeEvent && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Select an event to load check-in data.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check-in Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {participantsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-4xl font-semibold mb-1">
                    {checkedInCount}/{totalCount}
                  </div>
                  <p className="text-sm text-muted-foreground">Participants checked in</p>
                </div>
                <Progress value={checkinRate} />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">{checkinRate}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event check-in QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EventCheckInQrPanel eventId={activeEvent?.id} eventTitle={activeEvent?.title} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workshop Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workshopsLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-muted-foreground">Loading workshops...</span>
              </div>
            )}

            {workshopsError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Failed to load workshops</span>
              </div>
            )}

            {!workshopsLoading && !workshopsError && workshops.length === 0 && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No workshops scheduled.
              </div>
            )}

            {!workshopsLoading && !workshopsError && workshops.map((workshop: Workshop) => (
              <div key={workshop.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium" title={workshop.title}>
                      {workshop.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(workshop.startTime).toLocaleString()} - {new Date(workshop.endTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <Badge
                    variant={
                      workshop.status === 'COMPLETED'
                        ? 'default'
                        : workshop.status === 'LIVE'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {workshop.status === 'COMPLETED'
                      ? 'Completed'
                      : workshop.status === 'LIVE'
                        ? 'Live'
                        : 'Scheduled'}
                  </Badge>
                </div>
                <Progress
                  value={
                    workshop.status === 'COMPLETED'
                      ? 100
                      : workshop.status === 'LIVE'
                        ? 60
                        : 0
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance List</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAttendance}
                disabled={!activeEvent?.id || participantsLoading || isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isExporting ? 'Exporting' : 'Export'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {participantsLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-muted-foreground">Loading participants...</span>
            </div>
          )}

          {participantsError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {participantsError instanceof ApiError
                  ? participantsError.firstError
                  : 'Failed to load participants'}
              </span>
            </div>
          )}

          {!participantsLoading && !participantsError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Team</TableHead>
                      <TableHead>Check-in</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {activeEvent
                        ? 'No participants registered for this event.'
                        : 'Select an event to view participants.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.user?.fullName || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.user?.email || '-'}
                      </TableCell>
                      <TableCell>
                        {p.team?.name || (
                          <span className="text-muted-foreground italic">No team</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.checkInStatus === 'CHECKED_IN' ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Not Checked In
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.checkInStatus !== 'CHECKED_IN' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={checkInMutation.isPending}
                            onClick={() => checkInMutation.mutate(p.id)}
                          >
                            {checkInMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Check In'
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <ListPagination page={page} pagination={participantsResponse?.pagination} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
