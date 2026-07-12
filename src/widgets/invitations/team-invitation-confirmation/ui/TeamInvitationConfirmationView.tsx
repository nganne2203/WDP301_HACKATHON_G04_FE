import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { teamsApi } from '@/entities/team/api';
import { ApiError } from '@/shared/api/client';
import type { InvitationDecisionResult } from '@/shared/api/types';

type Decision = 'accept' | 'decline';

export function TeamInvitationConfirmation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const initialDecision = searchParams.get('decision') as Decision | null;
  const [decision, setDecision] = useState<Decision | null>(
    initialDecision === 'accept' || initialDecision === 'decline' ? initialDecision : null
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvitationDecisionResult | null>(null);
  const [error, setError] = useState('');

  async function submit(nextDecision: Decision) {
    if (!token) {
      setError('Invitation token is missing.');
      return;
    }

    setDecision(nextDecision);
    setLoading(true);
    setError('');
    try {
      const response = nextDecision === 'accept'
        ? await teamsApi.acceptInvitation(token)
        : await teamsApi.declineInvitation(token);
      setResult(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.firstError);
      } else {
        setError('Connection failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (decision && !result && !error && !loading) {
      void submit(decision);
    }
  }, []);

  const accepted = result?.status === 'ACCEPTED';
  const declined = result?.status === 'DECLINED';
  const rejected = result?.status === 'REJECTED';
  const cancelled = result?.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="w-12 h-12 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
            <MailCheck className="w-6 h-6" />
          </div>
          <CardTitle>Team invitation</CardTitle>
          <CardDescription>
            Confirm whether you want to join this SEAL Hackathon team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!decision && !result && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={() => submit('accept')}>Accept invitation</Button>
              <Button variant="outline" onClick={() => submit('decline')}>Decline</Button>
            </div>
          )}

          {loading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Confirming invitation</AlertTitle>
              <AlertDescription>Please wait while we update your team status.</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className={accepted ? 'border-green-200 bg-green-50' : undefined}>
              {accepted ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4" />}
              <AlertTitle>
                {accepted && 'Invitation accepted'}
                {declined && 'Invitation declined'}
                {rejected && 'Team registration rejected'}
                {cancelled && 'Team invitation cancelled'}
                {!accepted && !declined && !rejected && !cancelled && `Invitation status: ${result.status}`}
              </AlertTitle>
              <AlertDescription>
                {accepted && `You joined ${result.team?.name || 'the team'}. You can sign in to view your team.`}
                {declined && 'The team leader has been notified.'}
                {rejected && 'The required number of confirmed teams has already been reached.'}
                {cancelled && 'This team is no longer accepting invitation confirmations.'}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Could not confirm invitation</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
