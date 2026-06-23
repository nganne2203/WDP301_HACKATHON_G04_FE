import { Loader2, UsersRound } from 'lucide-react';

import { useMentorTeamsView } from '../model/useMentorTeamsView';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { TeamCard } from './components/TeamCard';
import { TeamDetail } from '@/entities/team';

export function MentorTeams() {
  const view = useMentorTeamsView();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">My Assigned Teams</h1>
          <p className="text-sm text-muted-foreground">
            {view.isSpeaker
              ? 'Speaker accounts do not have team assignment management in the current scope.'
              : 'Teams assigned to you in the seeded mentor scope.'}
          </p>
        </div>
        <div className="w-full md:w-80">
          <Label>Event</Label>
          <Select value={view.selectedEvent?.id || ''} onValueChange={view.setSelectedEventId} disabled={view.eventsQuery.isLoading}>
            <SelectTrigger className="mt-1">
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

      <Alert>
        <UsersRound className="h-4 w-4" />
        <AlertTitle>{view.isSpeaker ? 'Speaker scope' : 'Mentor scope'}</AlertTitle>
        <AlertDescription>
          {view.isSpeaker
            ? 'This route remains available for shared navigation, but speakers are centered around workshops rather than team assignment.'
            : 'This seeded environment now includes mentor-to-team assignments so you can review teams that belong to your mentoring scope.'}
        </AlertDescription>
      </Alert>

      {view.teamsQuery.isLoading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading teams</AlertTitle>
          <AlertDescription>Reading teams for the selected event.</AlertDescription>
        </Alert>
      ) : view.teams.length === 0 ? (
        <Alert>
          <AlertTitle>No teams found</AlertTitle>
          <AlertDescription>
            {view.isSpeaker
              ? 'No team assignment data is available for speaker accounts.'
              : 'No teams are assigned to you for the selected event yet.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {view.teams.map((team) => (
            <Sheet key={team.id}>
              <SheetTrigger asChild>
                <div>
                  <TeamCard team={team} isSpeaker={view.isSpeaker} />
                </div>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto px-6 sm:max-w-xl">
                <SheetHeader className="pr-8">
                  <SheetTitle>{team.name}</SheetTitle>
                  <SheetDescription>
                    Review confirmed members and pending invitations for this team.
                  </SheetDescription>
                </SheetHeader>
                <TeamDetail team={team} />
              </SheetContent>
            </Sheet>
          ))}
        </div>
      )}
    </div>
  );
}

