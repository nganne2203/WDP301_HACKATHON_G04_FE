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
          Create team repositories, manage access, and review code activity.
        </p>
      </div>

      <RepositoryConfigSection view={view} />
      <LinkedRepositoriesCard view={view} />
      <RepositoryCollaborationSection view={view} />
      <RepositoryDangerZoneCard view={view} />

      <RepositoryDetailDialog repository={view.selectedRepository} open={Boolean(view.selectedRepository)} onClose={() => view.setSelectedRepository(null)} />
    </div>
  );
}
