import { MessageSquare, Loader2, UsersRound } from 'lucide-react';
import { useState } from 'react';

import { useMentorTeamsView } from '../model/useMentorTeamsView';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ListPagination } from '@/shared/ui/list-pagination';
import { TeamCard } from './components/TeamCard';
import { MentorTeamWorkspaceSheet } from './components/MentorTeamWorkspaceSheet';

export function MentorTeams() {
  const view = useMentorTeamsView();
  const [workspaceTeamId, setWorkspaceTeamId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'chat'>('overview');

  const workspaceTeam = view.teams.find((team) => team.id === workspaceTeamId) || null;

  const openWorkspace = (teamId: string, tab: 'overview' | 'chat') => {
    setWorkspaceTeamId(teamId);
    setWorkspaceTab(tab);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div>
          <h1 className="text-2xl font-semibold mb-1">My Assigned Teams</h1>
          <p className="text-sm text-muted-foreground">
            {view.isSpeaker
              ? 'Speakers manage workshops instead of teams.'
            : 'View the teams assigned to you.'}
          </p>
        </div>
      </div>

      <Alert>
        <UsersRound className="h-4 w-4" />
        <AlertTitle>{view.isSpeaker ? 'Speaker access' : 'Your assignments'}</AlertTitle>
        <AlertDescription>
          {view.isSpeaker
            ? 'Go to Workshops to view your sessions and participant questions.'
            : 'Open a team to view its members or start a chat.'}
        </AlertDescription>
      </Alert>

      {view.teamsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading teams</AlertTitle>
          <AlertDescription>Loading teams for this competition.</AlertDescription>
        </Alert>
      ) : view.teams.length === 0 ? (
        <Alert>
          <AlertTitle>No teams found</AlertTitle>
          <AlertDescription>
            {view.isSpeaker
              ? 'Team assignments are not available for speakers.'
              : 'No teams are assigned to you for this competition.'}
          </AlertDescription>
        </Alert>
      ) : (
        <>
        <div className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {view.teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              isSpeaker={view.isSpeaker}
              footer={(
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => openWorkspace(team.id, 'overview')}>
                    View details
                  </Button>
                  <Button type="button" className="relative" onClick={() => openWorkspace(team.id, 'chat')}>
                    {(view.unreadCountsByTeamId.get(team.id) || 0) > 0 ? (
                      <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white shadow">
                        {(view.unreadCountsByTeamId.get(team.id) || 0) > 99 ? '99+' : view.unreadCountsByTeamId.get(team.id)}
                      </span>
                    ) : null}
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message team
                  </Button>
                </div>
              )}
            />
          ))}
        </div>
        <ListPagination page={view.page} pagination={view.pagination} onPageChange={view.setPage} />
        </>
      )}

      {workspaceTeam ? (
        <MentorTeamWorkspaceSheet
          team={workspaceTeam}
          open={Boolean(workspaceTeam)}
          activeTab={workspaceTab}
          onActiveTabChange={setWorkspaceTab}
          onOpenChange={(open) => {
            if (!open) setWorkspaceTeamId(null);
          }}
        />
      ) : null}
    </div>
  );
}
