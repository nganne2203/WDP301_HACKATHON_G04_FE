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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold">Repository Management</h1>
          <p className="text-sm text-muted-foreground">
            Create team repositories, manage access, and review code activity.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="w-full sm:w-80">
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
        </div>
      </div>

      <RepositoryConfigSection view={view} />
      <LinkedRepositoriesCard view={view} />
      <RepositoryCollaborationSection view={view} />
      <RepositoryDangerZoneCard view={view} />

      <RepositoryDetailDialog repository={view.selectedRepository} open={Boolean(view.selectedRepository)} onClose={() => view.setSelectedRepository(null)} />
    </div>
  );
}
