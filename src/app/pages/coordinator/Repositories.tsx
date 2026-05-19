import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Github, Settings, ShieldCheck, ShieldX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';

const mockRepos = [
  {
    team: 'Code Wizards',
    repoUrl: 'seal-2026/code-wizards',
    contributors: 3,
    lastSync: '2 hours ago',
    status: 'granted' as const,
    lastCommit: '2 hours ago',
  },
  {
    team: 'Data Ninjas',
    repoUrl: 'seal-2026/data-ninjas',
    contributors: 3,
    lastSync: '30 mins ago',
    status: 'granted' as const,
    lastCommit: '1 hour ago',
  },
  {
    team: 'Cloud Architects',
    repoUrl: 'seal-2026/cloud-architects',
    contributors: 3,
    lastSync: '5 hours ago',
    status: 'granted' as const,
    lastCommit: '3 hours ago',
  },
];

export function Repositories() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Repository Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage GitHub repositories and team access
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Github className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm">
          GitHub organization connected: <strong>seal-hackathon-2026</strong>. Repositories will
          be automatically created for teams and access will be granted to team members.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                GitHub Configuration
              </h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="org" className="text-sm">
                  Organization Name
                </Label>
                <Input id="org" defaultValue="seal-hackathon-2026" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token" className="text-sm">
                  Access Token
                </Label>
                <Input id="token" type="password" defaultValue="ghp_****************" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template" className="text-sm">
                  Repository Template
                </Label>
                <Input id="template" placeholder="seal-template" />
              </div>

              <Button className="w-full" variant="outline">
                Update Configuration
              </Button>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button className="w-full" variant="default">
                <Github className="w-4 h-4 mr-2" />
                Create All Repositories
              </Button>
              <Button className="w-full" variant="outline">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Grant Access to All
              </Button>
              <Button className="w-full" variant="destructive">
                <ShieldX className="w-4 h-4 mr-2" />
                Revoke All Access
              </Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="font-medium mb-4">Team Repositories</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead>Contributors</TableHead>
                <TableHead>Last Commit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRepos.map((repo, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{repo.team}</TableCell>
                  <TableCell>
                    <a
                      href="#"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Github className="w-4 h-4" />
                      {repo.repoUrl}
                    </a>
                  </TableCell>
                  <TableCell>{repo.contributors}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {repo.lastCommit}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        repo.status === 'granted'
                          ? 'default'
                          : repo.status === 'not_granted'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {repo.status === 'granted'
                        ? 'Access Granted'
                        : repo.status === 'not_granted'
                        ? 'Not Granted'
                        : 'Revoked'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
