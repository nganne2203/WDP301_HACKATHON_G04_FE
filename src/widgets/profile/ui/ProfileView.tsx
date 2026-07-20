import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Link, Loader2, Save, Upload, UserCircle, X } from 'lucide-react';
import { toast } from 'sonner';

import { useStore } from '@/entities/session/model/store';
import { GitHubUserPicker } from '@/features/github/user-picker/ui/GitHubUserPicker';
import { queryKeys } from '@/lib/queryKeys';
import { usersApi } from '@/shared/api/users';
import { eventsApi } from '@/shared/api/competitions';
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
const avatarMaxSizeBytes = 10 * 1024 * 1024;
const avatarAllowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
  const startDate = participant.competition?.startDate;
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
  const [githubValid, setGithubValid] = useState(true);
  const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('url');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);

  useEffect(() => {
    if (user) {
      setForm(toProfileForm(user));
      setGithubValid(true);
    }
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const eventsQuery = useQuery({
    queryKey: queryKeys.competitions.list({ page: 1, limit: 100 }),
    queryFn: async () => (await eventsApi.list({ page: 1, limit: 100 })).data,
    enabled: Boolean(user),
  });

  const participantQueries = useQueries({
    queries: (eventsQuery.data || []).map((competition) => ({
      queryKey: [...queryKeys.participants.all, 'me', competition.id],
      queryFn: async () => (await participantsApi.getMine(competition.id)).data as Participant | null,
      enabled: Boolean(user && competition.id),
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

  const avatarUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return usersApi.uploadAvatar(formData, setAvatarUploadProgress);
    },
    onSuccess: async (response) => {
      setUser(response.data);
      setForm(toProfileForm(response.data));
      setAvatarFile(null);
      setAvatarUploadProgress(0);
      queryClient.setQueryData(queryKeys.auth.me(), response.data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      toast.success('Avatar updated', {
        description: 'Your uploaded avatar is now active.',
      });
    },
    onError: (error: unknown) => {
      setAvatarUploadProgress(0);
      toast.error('Could not upload avatar', {
        description: error instanceof ApiError ? error.firstError : 'Please choose another image.',
      });
    },
  });

  const githubError = useMemo(() => {
    const value = form.githubUsername.trim();
    if (!value) return '';
    if (value.length > 39) return 'GitHub username must be 39 characters or fewer.';
    if (!githubPattern.test(value)) return 'Use a valid GitHub username format.';
    if (!githubLocked && !githubValid) return 'Select a valid GitHub account before saving.';
    return '';
  }, [form.githubUsername, githubLocked, githubValid]);

  const avatarFileError = useMemo(() => {
    if (!avatarFile) return '';
    if (!avatarAllowedTypes.has(avatarFile.type)) return 'Use a JPG, PNG, or WebP image.';
    if (avatarFile.size > avatarMaxSizeBytes) return 'Avatar image must be 10MB or smaller.';
    return '';
  }, [avatarFile]);

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

  const submitProfile = (competition: FormEvent<HTMLFormElement>) => {
    competition.preventDefault();
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

  const handleAvatarFileChange = (competition: React.ChangeEvent<HTMLInputElement>) => {
    const file = competition.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const uploadAvatar = () => {
    if (!avatarFile) {
      toast.error('Select an avatar image first.');
      return;
    }
    if (avatarFileError) {
      toast.error('Avatar is not valid', { description: avatarFileError });
      return;
    }

    avatarUploadMutation.mutate(avatarFile);
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
              {(avatarPreviewUrl || form.avatarUrl) && <AvatarImage src={avatarPreviewUrl || form.avatarUrl} alt={form.fullName} />}
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
                GitHub username can only be changed before your joined competition starts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {githubLocked && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>GitHub username is locked</AlertTitle>
                  <AlertDescription>
                    You are joined in {githubLockedParticipant?.competition?.title || 'an competition'} that has already started.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(competition) => setForm((current) => ({ ...current, fullName: competition.target.value }))}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="githubUsername">GitHub username</Label>
                <GitHubUserPicker
                  id="githubUsername"
                  value={form.githubUsername}
                  onChange={(value) => setForm((current) => ({ ...current, githubUsername: value }))}
                  onValidityChange={(valid) => {
                    const unchanged = form.githubUsername.trim().toLowerCase() === (user.githubUsername || '').trim().toLowerCase();
                    setGithubValid(valid || unchanged);
                  }}
                  disabled={githubLocked || isCheckingRegistrations}
                  excludeSelf
                />
                {githubError && <p className="text-sm text-red-600">{githubError}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(competition) => setForm((current) => ({ ...current, phone: competition.target.value }))}
                  maxLength={30}
                />
              </div>

              <div className="grid gap-2">
                <Label>Avatar</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={avatarMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAvatarMode('url')}
                  >
                    <Link className="mr-2 h-4 w-4" />
                    Link
                  </Button>
                  <Button
                    type="button"
                    variant={avatarMode === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAvatarMode('upload')}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>

                {avatarMode === 'url' ? (
                  <Input
                    id="avatarUrl"
                    value={form.avatarUrl}
                    onChange={(competition) => setForm((current) => ({ ...current, avatarUrl: competition.target.value }))}
                    placeholder="https://..."
                  />
                ) : (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Input
                        id="avatarFile"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarFileChange}
                        disabled={avatarUploadMutation.isPending}
                      />
                      {avatarFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setAvatarFile(null)}
                          disabled={avatarUploadMutation.isPending}
                          aria-label="Remove avatar file"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {avatarFile && (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {avatarPreviewUrl && <AvatarImage src={avatarPreviewUrl} alt={avatarFile.name} />}
                          <AvatarFallback>{getInitials(form.fullName || user.fullName || 'User')}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{avatarFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(avatarFile.size / 1024 / 1024).toFixed(2)} MB
                            {avatarUploadMutation.isPending && ` · ${avatarUploadProgress}%`}
                          </p>
                        </div>
                      </div>
                    )}
                    {avatarFileError && <p className="text-sm text-red-600">{avatarFileError}</p>}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={uploadAvatar}
                        disabled={!avatarFile || Boolean(avatarFileError) || avatarUploadMutation.isPending}
                      >
                        {avatarUploadMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload avatar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(competition) => setForm((current) => ({ ...current, bio: competition.target.value }))}
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
