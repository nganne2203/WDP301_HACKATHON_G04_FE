import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { QrCode, Download, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';
import { participantsApi, workshopsApi } from '../../../lib/api';
import { ApiError } from '../../../lib/api/client';
import type { Workshop } from '../../../lib/api/types';
import { useStore } from '../../../store/useStore';

export function Checkin() {
  const queryClient = useQueryClient();
  const selectedEvent = useStore((s) => s.selectedEvent);

  // Fetch real participants filtered by selected event
  const { data: participantsResponse, isLoading: participantsLoading, error: participantsError } = useQuery({
    queryKey: ['participants', selectedEvent?.id],
    queryFn: () => participantsApi.list({
      eventId: selectedEvent?.id,
      limit: 100,
    }),
    enabled: true,
  });

  const participants = participantsResponse?.data || [];
  const checkedInCount = participants.filter((p) => p.checkInStatus === 'CHECKED_IN').length;
  const totalCount = participants.length;
  const checkinRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (id: string) => participantsApi.checkIn(id),
    onSuccess: () => {
      toast.success('Check-in successful');
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
    onError: (error: unknown) => {
      toast.error('Check-in failed', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  // Fetch real workshops from backend
  const { data: workshopsResponse, isLoading: workshopsLoading, error: workshopsError } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => workshopsApi.list({ page: 1, limit: 10 }),
  });

  const workshops = workshopsResponse?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Check-in & Seminar</h1>
        <p className="text-sm text-muted-foreground">
          Manage participant attendance and workshop sessions
        </p>
      </div>

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
            <CardTitle className="text-base">QR Code Check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
            <Button className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
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

            {!workshopsLoading && !workshopsError && workshops.map((workshop: Workshop) => {
              const totalAttendees = 87; // fallback mock total
              const attendanceCount = workshop.status === 'COMPLETED' ? 45 : workshop.status === 'LIVE' ? 38 : 0;
              const rate = Math.round((attendanceCount / totalAttendees) * 100);

              return (
                <div key={workshop.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium truncate max-w-[160px]" title={workshop.title}>
                      {workshop.title}
                    </span>
                    <Badge variant={workshop.status === 'COMPLETED' ? 'default' : workshop.status === 'LIVE' ? 'secondary' : 'outline'}>
                      {workshop.status === 'COMPLETED' ? `${attendanceCount}/${totalAttendees}` : workshop.status === 'LIVE' ? 'Live' : 'Upcoming'}
                    </Badge>
                  </div>
                  <Progress value={rate} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance List</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
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
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {selectedEvent
                        ? 'No participants registered for this event.'
                        : 'Select an event to view participants.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.user?.fullName || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.user?.email || '—'}
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
                            Pending
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
        </CardContent>
      </Card>
    </div>
  );
}
