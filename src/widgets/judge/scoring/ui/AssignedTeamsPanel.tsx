import { CheckCircle2 } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import type { JudgingBoard, ScoreSheet } from '@/shared/api/types';

export function AssignedTeamsPanel({
  board,
  assignedTeams,
  selectedTeamId,
  onSelectTeam,
  sheetStatusByTeamId,
}: {
  board: JudgingBoard | null;
  assignedTeams: NonNullable<JudgingBoard['teams']>;
  selectedTeamId?: string | null;
  onSelectTeam: (teamId: string) => void;
  sheetStatusByTeamId: Map<string, ScoreSheet['status']>;
}) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-base">Assigned Teams</CardTitle>
        {board && <p className="text-xs text-muted-foreground">{board.name}</p>}
      </CardHeader>
      <CardContent className="space-y-2">
        {assignedTeams.map((team) => {
          const status = sheetStatusByTeamId.get(team.id);
          const done = status === 'SUBMITTED' || status === 'LOCKED';
          return (
            <button
              key={team.id}
              onClick={() => onSelectTeam(team.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                selectedTeamId === team.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{team.name}</p>
                {team.projectName && <p className="text-xs text-muted-foreground truncate">{team.projectName}</p>}
              </div>
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <Badge variant="secondary" className="shrink-0 text-xs">Pending</Badge>
              )}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
