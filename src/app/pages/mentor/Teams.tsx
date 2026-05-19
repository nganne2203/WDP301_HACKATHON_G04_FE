import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Users, Github } from 'lucide-react';

const mentorTeams = [
  {
    id: 'team-001',
    name: 'Code Wizards',
    track: 'Web Development',
    leader: 'Alice Chen',
    members: 3,
    repo: 'github.com/seal-2026/code-wizards',
    status: 'active' as const,
  },
  {
    id: 'team-002',
    name: 'Data Ninjas',
    track: 'AI/ML',
    leader: 'Bob Smith',
    members: 3,
    repo: 'github.com/seal-2026/data-ninjas',
    status: 'active' as const,
  },
];

export function MentorTeams() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold mb-1">My Teams</h1>
        <p className="text-sm text-muted-foreground">Teams assigned to you for mentoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mentorTeams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{team.track}</p>
                </div>
                <Badge variant="default">{team.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                    {team.leader.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{team.leader}</p>
                  <p className="text-xs text-muted-foreground">Team Leader</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{team.members} members</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Github className="w-4 h-4" />
                <a href="#" className="text-blue-600 hover:underline">{team.repo}</a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
