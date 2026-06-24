import { useState, type FormEvent } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Github, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { resolveHomePathForUser } from '@/entities/session/lib/navigation';
import { useGoogleRegisterMutation, useGoogleSignInMutation } from '@/hooks/mutations/useAuthMutations';
import { ApiError } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface GoogleCredentialPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

function decodeGoogleCredential(credential: string): GoogleCredentialPayload {
  const payload = credential.split('.')[1];
  if (!payload) throw new Error('Google returned an invalid credential.');

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  const claims = JSON.parse(new TextDecoder().decode(bytes)) as Partial<GoogleCredentialPayload>;

  if (!claims.sub || !claims.email || !claims.name) {
    throw new Error('Google profile is missing required information.');
  }

  return claims as GoogleCredentialPayload;
}

export function GoogleLoginButton() {
  const navigate = useNavigate();
  const googleSignInMutation = useGoogleSignInMutation();
  const googleRegisterMutation = useGoogleRegisterMutation();
  const [pendingProfile, setPendingProfile] = useState<GoogleCredentialPayload | null>(null);
  const [githubUsername, setGithubUsername] = useState('');
  const [githubError, setGithubError] = useState('');

  async function handleSuccess(response: CredentialResponse) {
    let profile: GoogleCredentialPayload | null = null;

    try {
      if (!response.credential) throw new Error('Google did not return a credential.');

      profile = decodeGoogleCredential(response.credential);
      const authResponse = await googleSignInMutation.mutateAsync({
        googleId: profile.sub,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture ?? null,
      });
      const { user } = authResponse.data;

      toast.success('Login successful!', {
        description: `Welcome, ${user.fullName}`,
      });
      navigate(resolveHomePathForUser(user));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'GOOGLE_REGISTRATION_REQUIRED' && profile) {
        setPendingProfile(profile);
        setGithubUsername('');
        setGithubError('');
        return;
      }

      if (error instanceof ApiError && error.code === 'FORBIDDEN') {
        toast.error('Account awaiting approval', { description: error.firstError });
        return;
      }

      const description = error instanceof ApiError
        ? error.firstError
        : error instanceof Error
          ? error.message
          : 'Please try again.';
      toast.error('Google login failed', { description });
    }
  }

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!pendingProfile) return;

    const normalizedUsername = githubUsername.trim();
    if (
      normalizedUsername.length > 39 ||
      !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(normalizedUsername)
    ) {
      setGithubError('Enter a valid GitHub username using letters, numbers, or hyphens.');
      return;
    }

    try {
      await googleRegisterMutation.mutateAsync({
        googleId: pendingProfile.sub,
        email: pendingProfile.email,
        name: pendingProfile.name,
        avatar: pendingProfile.picture ?? null,
        githubUsername: normalizedUsername,
      });

      setPendingProfile(null);
      setGithubUsername('');
      toast.success('Registration successful!', {
        description: 'Your account is waiting for approval. You can sign in after an authorized organizer approves it.',
      });
    } catch (error) {
      const description = error instanceof ApiError
        ? error.firstError
        : 'Could not complete registration. Please try again.';
      toast.error('Google registration failed', { description });
    }
  }

  return (
    <>
      <div className="flex w-full justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => toast.error('Google login failed', { description: 'Please try again.' })}
          text="signin_with"
          shape="rectangular"
          size="large"
          theme="outline"
          width="400"
          ux_mode="popup"
        />
      </div>

      <Dialog
        open={Boolean(pendingProfile)}
        onOpenChange={(open) => {
          if (!open) setPendingProfile(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete your registration</DialogTitle>
            <DialogDescription>
              Add your GitHub username. Your participant account will then be sent for approval.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleRegistration}>
            <div className="space-y-2">
              <Label htmlFor="google-github-username">GitHub username</Label>
              <div className="relative">
                <Github className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="google-github-username"
                  value={githubUsername}
                  onChange={(event) => {
                    setGithubUsername(event.target.value);
                    setGithubError('');
                  }}
                  className="pl-9"
                  placeholder="octocat"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {githubError && <p className="text-sm text-red-600">{githubError}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={googleRegisterMutation.isPending}>
              {googleRegisterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for approval
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
