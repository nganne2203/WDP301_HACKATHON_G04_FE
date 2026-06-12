import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

export function AdminMediaLeadersCard({
  statistics,
}: {
  statistics: any;
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
              {(statistics?.mostActiveParticipants || []).slice(0, 5).map((item: any) => (
                <TableRow key={item.participantId}>
                  <TableCell className="max-w-[220px] truncate">{item.participantId}</TableCell>
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
              {(statistics?.mostViewedMedia || []).slice(0, 5).map((item: any) => (
                <TableRow key={item.mediaId}>
                  <TableCell className="max-w-[220px] truncate">{item.mediaId}</TableCell>
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
