import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Plus, Users, Crown, Github, MoreVertical, X } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { mockTeams } from '../../../lib/data';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { toast } from 'sonner';

export function Teams() {
  const [selectedTeam, setSelectedTeam] = useState(mockTeams[0]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<string[]>(['', '', '']);

  const addMember = () => {
    setTeamMembers([...teamMembers, '']);
  };

  const removeMember = (index: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(teamMembers.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, value: string) => {
    const updated = [...teamMembers];
    updated[index] = value;
    setTeamMembers(updated);
  };

  const handleCreateTeam = () => {
    toast.success('Team Created', {
      description: 'New team has been created successfully.',
    });
    setCreateDialogOpen(false);
    setTeamMembers(['', '', '']);
  };

  const handleEditTeam = (team: typeof mockTeams[0]) => {
    toast.info('Edit Team', {
      description: `Editing team: ${team.name}`,
    });
  };

  const handleAssignBoard = (team: typeof mockTeams[0]) => {
    toast.info('Assign Board', {
      description: `Assigning judging board for: ${team.name}`,
    });
  };

  const handleViewRepository = (team: typeof mockTeams[0]) => {
    toast.info('Repository', {
      description: `Opening repository for: ${team.name}`,
    });
  };

  const handleDeleteTeam = (team: typeof mockTeams[0]) => {
    toast.error('Team Deleted', {
      description: `${team.name} has been deleted.`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Team Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and organize hackathon teams</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Add a new team to the hackathon event.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input id="team-name" placeholder="Enter team name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-track">Track</Label>
                  <Select>
                    <SelectTrigger id="team-track">
                      <SelectValue placeholder="Select track" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web Development</SelectItem>
                      <SelectItem value="mobile">Mobile Apps</SelectItem>
                      <SelectItem value="ai">AI/ML</SelectItem>
                      <SelectItem value="blockchain">Blockchain</SelectItem>
                      <SelectItem value="iot">IoT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-leader">Team Leader Email</Label>
                <Input
                  id="team-leader"
                  type="email"
                  placeholder="leader@university.edu"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Team Members</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMember}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Member
                  </Button>
                </div>
                <div className="space-y-2">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder={`member${index + 1}@university.edu`}
                        value={member}
                        onChange={(e) => updateMember(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        disabled={teamMembers.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-board">Judging Board (Optional)</Label>
                <Select>
                  <SelectTrigger id="team-board">
                    <SelectValue placeholder="Assign to board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Board 1</SelectItem>
                    <SelectItem value="2">Board 2</SelectItem>
                    <SelectItem value="3">Board 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam}>Create Team</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Team Capacity</span>
            <span className="text-sm text-muted-foreground">28 / 30 teams</span>
          </div>
          <Progress value={93} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTeams.map((team) => (
          <Sheet key={team.id}>
            <SheetTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{team.track}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleEditTeam(team);
                        }}>
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleAssignBoard(team);
                        }}>
                          Assign Board
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleViewRepository(team);
                        }}>
                          View Repository
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team);
                          }}
                        >
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="w-4 h-4 text-yellow-600" />
                    <span className="text-muted-foreground">Leader:</span>
                    <span className="font-medium">{team.leader}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-medium">{team.members}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={team.repoStatus === 'granted' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      <Github className="w-3 h-3 mr-1" />
                      {team.repoStatus === 'granted' ? 'Repo Granted' : 'No Repo'}
                    </Badge>
                    <Badge
                      variant={team.submissionStatus === 'submitted' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {team.submissionStatus === 'submitted' ? 'Submitted' : 'Pending'}
                    </Badge>
                  </div>

                  {team.board && (
                    <div className="text-xs text-muted-foreground">
                      Board {team.board} • Score: {team.score}
                    </div>
                  )}
                </CardContent>
              </Card>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{team.name}</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Team Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Track:</span>
                      <span className="font-medium">{team.track}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Board:</span>
                      <span className="font-medium">Board {team.board}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Score:</span>
                      <span className="font-medium">{team.score}/100</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Team Members</h3>
                  <div className="space-y-2">
                    {[team.leader, 'David Kim', 'Emma Liu'].map((member, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {member
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member}</p>
                          {i === 0 && (
                            <p className="text-xs text-muted-foreground">Team Leader</p>
                          )}
                        </div>
                        {i === 0 && <Crown className="w-4 h-4 text-yellow-600" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Repository</h3>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="default">Access Granted</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Repository:</span>
                      <a
                        href="#"
                        className="text-blue-600 hover:underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        seal-2026/team-001
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Commit:</span>
                      <span>2 hours ago</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Edit Team</Button>
                  <Button variant="outline" className="flex-1">
                    View Submission
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ))}
      </div>
    </div>
  );
}
