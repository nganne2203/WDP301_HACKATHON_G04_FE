import { useState, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, Mail, Search, Filter } from 'lucide-react';
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
import { Checkbox } from '../../components/ui/checkbox';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import { Label } from '../../components/ui/label';
import { mockParticipants } from '../../../lib/data';
import { toast } from 'sonner';

type FilterType = 'all' | 'active' | 'registered' | 'checkedIn' | 'githubAccess';

export function Participants() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const filteredParticipants = useMemo(() => {
    let filtered = mockParticipants;

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilter === 'active') {
      filtered = filtered.filter((p) => p.status === 'active');
    } else if (activeFilter === 'registered') {
      filtered = filtered.filter((p) => p.status === 'registered');
    } else if (activeFilter === 'checkedIn') {
      filtered = filtered.filter((p) => p.checkedIn);
    } else if (activeFilter === 'githubAccess') {
      filtered = filtered.filter((p) => p.githubAccess);
    }

    return filtered;
  }, [searchQuery, activeFilter]);

  const allSelected = filteredParticipants.length > 0 && selectedIds.length === filteredParticipants.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredParticipants.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSendInvites = () => {
    if (selectedIds.length === 0) {
      toast.error('No participants selected', {
        description: 'Please select at least one participant to send invites.',
      });
      return;
    }
    toast.success('Invites Sent', {
      description: `Sent invites to ${selectedIds.length} participant(s).`,
    });
    setSelectedIds([]);
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0
      ? filteredParticipants.filter((p) => selectedIds.includes(p.id))
      : filteredParticipants;

    toast.success('Export Successful', {
      description: `Exported ${dataToExport.length} participant(s) to CSV.`,
    });
  };

  const filterCounts = {
    all: mockParticipants.length,
    active: mockParticipants.filter((p) => p.status === 'active').length,
    registered: mockParticipants.filter((p) => p.status === 'registered').length,
    checkedIn: mockParticipants.filter((p) => p.checkedIn).length,
    githubAccess: mockParticipants.filter((p) => p.githubAccess).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Participants</h1>
          <p className="text-sm text-muted-foreground">
            Manage participant registration and status
            {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSendInvites}>
            <Mail className="w-4 h-4 mr-2" />
            Send Invites
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setFilterSheetOpen(true)}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="flex gap-2">
        <Badge
          variant={activeFilter === 'all' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveFilter('all')}
        >
          All ({filterCounts.all})
        </Badge>
        <Badge
          variant={activeFilter === 'active' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveFilter('active')}
        >
          Active ({filterCounts.active})
        </Badge>
        <Badge
          variant={activeFilter === 'registered' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveFilter('registered')}
        >
          Registered ({filterCounts.registered})
        </Badge>
        <Badge
          variant={activeFilter === 'checkedIn' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveFilter('checkedIn')}
        >
          Checked In ({filterCounts.checkedIn})
        </Badge>
        <Badge
          variant={activeFilter === 'githubAccess' ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => setActiveFilter('githubAccess')}
        >
          GitHub Access ({filterCounts.githubAccess})
        </Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                  className={someSelected ? 'data-[state=checked]:bg-primary' : ''}
                />
              </TableHead>
              <TableHead>Participant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>GitHub</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(participant.id)}
                    onCheckedChange={() => toggleSelect(participant.id)}
                    aria-label={`Select ${participant.name}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {participant.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{participant.name}</p>
                      <p className="text-xs text-muted-foreground">{participant.role}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {participant.email}
                </TableCell>
                <TableCell>
                  {participant.team ? (
                    <span className="text-sm">{participant.team}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No team</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      participant.status === 'active'
                        ? 'default'
                        : participant.status === 'registered'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {participant.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {participant.checkedIn ? (
                    <Badge variant="default" className="bg-green-500">
                      ✓ Checked In
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {participant.githubAccess ? (
                    <Badge variant="default" className="bg-purple-500">
                      Granted
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Granted</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filter Participants</SheetTitle>
            <SheetDescription>
              Apply advanced filters to narrow down the participant list.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="filter-active" />
                  <label htmlFor="filter-active" className="text-sm cursor-pointer">
                    Active participants
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="filter-registered" />
                  <label htmlFor="filter-registered" className="text-sm cursor-pointer">
                    Registered only
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Check-in Status</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="filter-checkedin" />
                <label htmlFor="filter-checkedin" className="text-sm cursor-pointer">
                  Checked in only
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>GitHub Access</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="filter-github" />
                <label htmlFor="filter-github" className="text-sm cursor-pointer">
                  Has GitHub access
                </label>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFilterSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  toast.info('Filters Applied');
                  setFilterSheetOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
