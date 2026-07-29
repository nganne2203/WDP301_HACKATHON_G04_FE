import { useState } from 'react';
import { Award, CheckCircle2, Loader2, Medal, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { finalistsApi } from '@/entities/finalist/api';
import { rankingsApi } from '@/entities/ranking/api';
import { useStore } from '@/entities/session/model/store';
import { useCompetitionsQuery, useMyTeamQuery, useRoundsQuery } from '@/hooks/queries/useCommonQueries';
import { queryKeys } from '@/lib/queryKeys';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const PLACE_ICONS = [Trophy, Medal, Award];
const PLACE_LABELS = ['1st Place', '2nd Place', '3rd Place'];

export function ParticipantResultsView() {
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const storeSelectedCompetition = useStore((state) => state.selectedCompetition);
  const [selectedRoundId, setSelectedRoundId] = useState('');

  const eventsQuery = useCompetitionsQuery();
  const competitions = eventsQuery.data || [];
  const selectedCompetition = competitions.find((competition) => competition.id === storeSelectedCompetition?.id) || competitions[0] || null;
  const activeCompetitionId = selectedCompetition?.id || '';

  const teamQuery = useMyTeamQuery(activeCompetitionId);
  const team = teamQuery.data;

  const roundsQuery = useRoundsQuery({ competitionId: activeCompetitionId, limit: 20 }, { enabled: Boolean(activeCompetitionId) });
  const rounds = roundsQuery.data || [];
  const activeRound = rounds.find((round) => round.id === selectedRoundId) || rounds[0] || null;
  const activeRoundId = activeRound?.id || '';
  const showFinalistIndicators = activeRound?.roundType !== 'FINAL';

  const rankingsQuery = useQuery({
    queryKey: queryKeys.rankings.list(activeCompetitionId, activeRoundId),
    enabled: Boolean(activeCompetitionId && activeRoundId && appRole),
    queryFn: async () => (await rankingsApi.list({ competitionId: activeCompetitionId, roundId: activeRoundId, limit: 50 })).data,
  });
  const rankings = rankingsQuery.data || [];

  const finalistsQuery = useQuery({
    queryKey: queryKeys.finalists.list(activeCompetitionId, activeRoundId),
    enabled: Boolean(activeCompetitionId && activeRoundId && appRole),
    queryFn: async () => (await finalistsApi.list({ competitionId: activeCompetitionId, roundId: activeRoundId, limit: 50 })).data,
  });
  const finalists = finalistsQuery.data || [];

  const myRanking = rankings.find((ranking) => ranking.teamId === team?.id) || null;
  const isFinalist = showFinalistIndicators && finalists.some((ranking) => ranking.teamId === team?.id);
  const podium = rankings.slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Results</h1>
          <p className="text-sm text-muted-foreground">View published rankings and your team standing for each round.</p>
        </div>
        <div className="grid w-full gap-3 md:w-auto">
          <div className="md:w-72">
            <Label>Round</Label>
            <Select value={activeRound?.id || ''} onValueChange={setSelectedRoundId} disabled={roundsQuery.isLoading}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {myRanking && (
        <Alert>
          <Trophy className="h-4 w-4" />
          <AlertTitle>{team?.name || user?.fullName || 'Your team'} is ranked #{myRanking.rank}</AlertTitle>
          <AlertDescription>
            Score: <strong>{myRanking.score.toFixed(2)}</strong>
            {isFinalist ? ' · Finalist selected' : ''}
          </AlertDescription>
        </Alert>
      )}

      {rankingsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading results</AlertTitle>
          <AlertDescription>Loading results for this round.</AlertDescription>
        </Alert>
      ) : rankings.length === 0 ? (
        <Alert>
          <AlertTitle>No results available</AlertTitle>
          <AlertDescription>Rankings have not been generated or published for this round yet.</AlertDescription>
        </Alert>
      ) : (
        <>
          {podium.length >= 3 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {podium.map((ranking, index) => {
                const Icon = PLACE_ICONS[index];
                const mine = ranking.teamId === team?.id;
                return (
                  <Card key={ranking.id} className={mine ? 'border-2 border-blue-500' : 'border-2'}>
                    <CardHeader className="pb-3 text-center">
                      <div className="mx-auto mb-2">
                        <Icon className="w-12 h-12 text-yellow-500" />
                      </div>
                      <CardTitle className="text-lg">{PLACE_LABELS[index]}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-xl font-semibold mb-2">{ranking.team?.name || 'Unknown team'}</p>
                      <Badge variant={mine ? 'default' : 'outline'}>
                        Score: {ranking.score.toFixed(2)}
                      </Badge>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        {showFinalistIndicators && ranking.isSelectedForFinal && <Badge>Finalist</Badge>}
                        {mine && <Badge variant="secondary">Your team</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Complete Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Track</TableHead>
                    {showFinalistIndicators && <TableHead>Finalist</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((ranking) => {
                    const mine = ranking.teamId === team?.id;
                    return (
                      <TableRow key={ranking.id} className={mine ? 'bg-blue-50' : undefined}>
                        <TableCell>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                            {ranking.rank}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{ranking.team?.name || 'Unknown team'}</p>
                            {mine && <p className="text-xs text-blue-700">Your team</p>}
                          </div>
                        </TableCell>
                        <TableCell>{ranking.score.toFixed(2)}</TableCell>
                        <TableCell>{ranking.track?.name || '—'}</TableCell>
                        {showFinalistIndicators && (
                          <TableCell>
                            {ranking.isSelectedForFinal ? (
                            <Badge>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Finalist
                            </Badge>
                          ) : (
                            <Badge variant="outline">—</Badge>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
