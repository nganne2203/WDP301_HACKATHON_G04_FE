import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import type { MediaStatistics } from '@/shared/api/types';

function getParticipantLabel(item: MediaStatistics['mostActiveParticipants'][number]) {
  return item.participant?.fullName || item.participant?.email || item.participantId;
}

function getMediaLabel(item: MediaStatistics['mostViewedMedia'][number]) {
  return item.media?.title || item.media?.originalFileName || item.mediaId;
}

export function AdminMediaLeadersCard({
  statistics,
}: {
  statistics?: MediaStatistics;
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Activity Leaders</CardTitle>
        <CardDescription>Top uploaders and most-viewed media.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-medium">Most active participants</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead className="text-right">Uploads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(statistics?.mostActiveParticipants || []).slice(0, 5).map((item) => (
                <TableRow key={item.participantId}>
                  <TableCell className="max-w-[220px]">
                    <span className="block truncate font-medium">{getParticipantLabel(item)}</span>
                    {item.participant?.email && item.participant.email !== getParticipantLabel(item) && (
                      <span className="block truncate text-xs text-muted-foreground">{item.participant.email}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.uploads}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Most viewed media</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Media</TableHead>
                <TableHead className="text-right">Views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(statistics?.mostViewedMedia || []).slice(0, 5).map((item) => (
                <TableRow key={item.mediaId}>
                  <TableCell className="max-w-[220px]">
                    <span className="block truncate font-medium">{getMediaLabel(item)}</span>
                    {item.media?.originalFileName && item.media.originalFileName !== getMediaLabel(item) && (
                      <span className="block truncate text-xs text-muted-foreground">{item.media.originalFileName}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.views}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
