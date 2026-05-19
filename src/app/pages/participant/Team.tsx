import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Github, Crown, Users, Wifi } from 'lucide-react';

const myTeam = {
  name: 'Code Wizards',
  track: 'Web Development',
  board: 'Board A',
  repo: 'github.com/seal-2026/code-wizards',
  members: [
    { name: 'Alice Chen', role: 'Team Leader', email: 'alice.chen@fpt.edu.vn', checkedIn: true, isMe: true },
    { name: 'David Nguyen', role: 'Member', email: 'david.n@fpt.edu.vn', checkedIn: true, isMe: false },
    { name: 'Mia Tran', role: 'Member', email: 'mia.tran@fpt.edu.vn', checkedIn: false, isMe: false },
  ],
};

export function ParticipantTeam() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">My Team</h1>
        <p className="text-sm text-muted-foreground">Team details and member information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{myTeam.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{myTeam.track}</p>
            </div>
            <Badge variant="secondary">{myTeam.board}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Github className="w-4 h-4" />
            <a href="#" className="text-blue-600 hover:underline">{myTeam.repo}</a>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{myTeam.members.length} members</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myTeam.members.map((member, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{member.name}</p>
                  {member.isMe && <Badge variant="outline" className="text-xs">You</Badge>}
                  {member.role === 'Team Leader' && (
                    <Crown className="w-3.5 h-3.5 text-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.checkedIn ? 'default' : 'secondary'} className="text-xs">
                  {member.checkedIn ? 'Checked In' : 'Not Checked In'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
