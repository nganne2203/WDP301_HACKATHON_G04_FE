import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Team } from '@/shared/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

export function TeamStatusAlert({ team }: { team: Team }) {
  if (team.status === 'CONFIRMED') {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>Team confirmed</AlertTitle>
        <AlertDescription>Your team has enough confirmed members and has reserved an competition slot.</AlertDescription>
      </Alert>
    );
  }

  if (team.status === 'REJECTED') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Team rejected</AlertTitle>
        <AlertDescription>
          {team.rejectionReason || 'The required number of confirmed teams has already been reached.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (team.status === 'CANCELLED') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Team cancelled</AlertTitle>
        <AlertDescription>
          {team.cancellationReason || 'This team was cancelled. It no longer occupies an competition slot.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (team.status === 'WAITLISTED') {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Team waitlisted</AlertTitle>
        <AlertDescription>Your team is confirmed but waiting for an available slot in the selected track or board.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <Clock className="h-4 w-4" />
      <AlertTitle>Waiting for member confirmations</AlertTitle>
      <AlertDescription>
        Your team is created. Invited members must accept their email links before the team can be confirmed.
      </AlertDescription>
    </Alert>
  );
}
