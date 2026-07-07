import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Github, Loader2, Save, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { queryKeys } from '@/lib/queryKeys';
import { usersApi } from '@/shared/api/users';
import { eventsApi } from '@/shared/api/events';
import { participantsApi } from '@/shared/api/participants';
import { ApiError } from '@/shared/api/client';
import type { Participant, UpdateProfileRequest } from '@/shared/api/types';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

const githubPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;

type ProfileForm = {
  fullName: string;
  avatarUrl: string;
  phone: string;
  bio: string;
  githubUsername: string;
};

function toProfileForm(user: NonNullable<ReturnType<typeof useStore.getState>['user']>): ProfileForm {
  return {
    fullName: user.fullName || '',
    avatarUrl: user.avatarUrl || '',
    phone: user.phone || '',
    bio: user.bio || '',
    githubUsername: user.githubUsername || '',
  };
}

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function isStartedJoinedParticipant(participant: Participant | null | undefined) {
  if (!participant || participant.status !== 'JOINED') return false;
  const startDate = participant.event?.startDate;
  if (!startDate) return false;
  const startTime = new Date(startDate).getTime();
  return Number.isFinite(startTime) && startTime <= Date.now();
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfileView() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(() => (user ? toProfileForm(user) : {
    fullName: '',
    avatarUrl: '',
    phone: '',
    bio: '',
    githubUsername: '',
  }));

  useEffect(() => {
    if (user) setForm(toProfileForm(user));
  }, [user]);

  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list({ page: 1, limit: 100 }),
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
    enabled: Boolean(user),
  });

  const participantQueries = useQueries({
    queries: (eventsQuery.data || []).map((event) => ({
      queryKey: [...queryKeys.participants.all, 'me', event.id],
      queryFn: async () => (await participantsApi.getMine(event.id)).data as Participant | null,
      enabled: Boolean(user && event.id),
      retry: false,
    })),
  });

  const registeredParticipants = participantQueries
    .map((query) => query.data)
    .filter((participant): participant is Participant => Boolean(participant));

  const githubLockedParticipant = registeredParticipants.find(isStartedJoinedParticipant);
  const githubLocked = Boolean(githubLockedParticipant);
  const isCheckingRegistrations = eventsQuery.isLoading || participantQueries.some((query) => query.isLoading);

  const profileMutation = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => usersApi.updateProfile(payload),
    onSuccess: async (response) => {
      setUser(response.data);
      queryClient.setQueryData(queryKeys.auth.me(), response.data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      toast.success('Profile updated', {
        description: 'Your profile information has been saved.',
      });
    },
    onError: (error: unknown) => {
      toast.error('Could not update profile', {
        description: error instanceof ApiError ? error.firstError : 'Please review your profile information.',
      });
    },
  });

  const githubError = useMemo(() => {
    const value = form.githubUsername.trim();
    if (!value) return '';
    if (value.length > 39) return 'GitHub username must be 39 characters or fewer.';
    if (!githubPattern.test(value)) return 'Use a valid GitHub username format.';
    return '';
  }, [form.githubUsername]);

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile unavailable</AlertTitle>
          <AlertDescription>Please sign in again to view your profile.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (githubError) return;

    const payload: UpdateProfileRequest = {
      fullName: form.fullName.trim(),
      avatarUrl: normalizeOptional(form.avatarUrl),
      phone: normalizeOptional(form.phone),
      bio: normalizeOptional(form.bio),
    };

    if (!githubLocked) {
      payload.githubUsername = normalizeOptional(form.githubUsername);
    }

    profileMutation.mutate(payload);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account identity and contact details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <Avatar className="h-24 w-24">
              {form.avatarUrl && <AvatarImage src={form.avatarUrl} alt={form.fullName} />}
              <AvatarFallback className="bg-blue-100 text-xl text-blue-900">
                {getInitials(form.fullName || user.fullName || 'User') || <UserCircle className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.fullName}</p>
              <p className="text-sm text-muted-foreground">{user.status}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {user.roles.map((role) => (
                <Badge key={role.id || role.name} variant="secondary">
                  {role.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={submitProfile}>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>
                GitHub username can only be changed before your joined event starts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {githubLocked && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>GitHub username is locked</AlertTitle>
                  <AlertDescription>
                    You are joined in {githubLockedParticipant?.event?.title || 'an event'} that has already started.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="githubUsername">GitHub username</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="githubUsername"
                    value={form.githubUsername}
                    onChange={(event) => setForm((current) => ({ ...current, githubUsername: event.target.value }))}
                    disabled={githubLocked || isCheckingRegistrations}
                    className="pl-9"
                    maxLength={39}
                  />
                </div>
                {githubError && <p className="text-sm text-red-600">{githubError}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  maxLength={30}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={form.avatarUrl}
                  onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                  maxLength={500}
                  className="min-h-24"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={profileMutation.isPending || Boolean(githubError)}>
                  {profileMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
