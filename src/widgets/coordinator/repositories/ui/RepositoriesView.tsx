import { Github } from 'lucide-react';

import { Card, CardContent } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import { useRepositoriesView } from '../model/useRepositoriesView';
import { LinkedRepositoriesCard } from './LinkedRepositoriesCard';
import { RepositoryCollaborationSection } from './RepositoryCollaborationSection';
import { RepositoryConfigSection } from './RepositoryConfigSection';
import { RepositoryDangerZoneCard } from './RepositoryDangerZoneCard';
import { RepositoryDetailDialog } from './RepositoryDetailDialog';

export function Repositories() {
  const view = useRepositoriesView();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="mb-1 text-2xl font-semibold">Repository Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage GitHub configuration, repository linkage, collaborator access, and evidence pipeline per event.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="w-full space-y-2 md:w-96">
            <Label>Event</Label>
            <Select value={view.activeEventId} onValueChange={view.setSelectedEventId} disabled={view.eventsQuery.isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {view.events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <RepositoryConfigSection view={view} />
      <LinkedRepositoriesCard view={view} />
      <RepositoryCollaborationSection view={view} />
      <RepositoryDangerZoneCard view={view} />

      <RepositoryDetailDialog repository={view.selectedRepository} open={Boolean(view.selectedRepository)} onClose={() => view.setSelectedRepository(null)} />
    </div>
  );
}
