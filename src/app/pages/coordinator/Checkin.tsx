import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { QrCode, Download, CheckCircle, Clock } from 'lucide-react';
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

const mockCheckIns = [
  {
    name: 'Alice Chen',
    email: 'alice.chen@university.edu',
    team: 'Code Wizards',
    checkedIn: true,
    time: '9:15 AM',
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@university.edu',
    team: 'Data Ninjas',
    checkedIn: true,
    time: '9:22 AM',
  },
  {
    name: 'Carol Wang',
    email: 'carol.wang@university.edu',
    team: null,
    checkedIn: false,
    time: null,
  },
];

export function Checkin() {
  const checkedInCount = mockCheckIns.filter((p) => p.checkedIn).length;
  const totalCount = mockCheckIns.length;
  const checkinRate = Math.round((checkedInCount / totalCount) * 100);

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
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Git Workshop</span>
                <Badge variant="default">45/87</Badge>
              </div>
              <Progress value={52} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">API Design Seminar</span>
                <Badge variant="default">38/87</Badge>
              </div>
              <Progress value={44} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Pitching Workshop</span>
                <Badge variant="secondary">Upcoming</Badge>
              </div>
              <Progress value={0} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance List</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Mark All Present
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCheckIns.map((participant, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {participant.email}
                  </TableCell>
                  <TableCell>
                    {participant.team || (
                      <span className="text-muted-foreground italic">No team</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {participant.checkedIn ? (
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
                  <TableCell className="text-sm text-muted-foreground">
                    {participant.time || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
