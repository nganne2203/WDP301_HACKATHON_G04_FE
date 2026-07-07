import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Search, XCircle } from 'lucide-react';

import { queryKeys } from '@/lib/queryKeys';
import { githubApi } from '@/shared/api/github';
import { ApiError } from '@/shared/api/client';
import type { GitHubUserProfile } from '@/shared/api/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Input } from '@/shared/ui/input';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

const githubUsernamePattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const searchPattern = /^[A-Za-z0-9@._ -]+$/;

type GitHubUserPickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (profile: GitHubUserProfile) => void;
  onValidityChange?: (valid: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  excludeSelf?: boolean;
};

function getLookupError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.firstError.includes('404') || error.firstError.toLowerCase().includes('not found')) {
      return 'GitHub user not found.';
    }
    return error.firstError;
  }

  return 'Could not validate this GitHub username.';
}

export function GitHubUserPicker({
  id,
  value,
  onChange,
  onSelect,
  onValidityChange,
  disabled,
  placeholder = 'octocat',
  excludeSelf = false,
}: GitHubUserPickerProps) {
  const [selectedLogin, setSelectedLogin] = useState('');
  const trimmedValue = value.trim();
  const debouncedQuery = useDebouncedValue(trimmedValue, 350);
  const formatValid = !trimmedValue || searchPattern.test(trimmedValue);
  const selectedFormatValid = !trimmedValue || githubUsernamePattern.test(trimmedValue);

  const searchQuery = useQuery({
    queryKey: queryKeys.github.userSearch(debouncedQuery),
    queryFn: async () => (await githubApi.searchUsers(debouncedQuery)).data,
    enabled: Boolean(debouncedQuery && formatValid && !disabled),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const results = searchQuery.data || [];
  const selectedProfile = results.find((profile) => profile.login.toLowerCase() === selectedLogin.toLowerCase()) || null;
  const selected = Boolean(selectedLogin && selectedLogin.toLowerCase() === trimmedValue.toLowerCase() && selectedFormatValid);

  const availabilityQuery = useQuery({
    queryKey: queryKeys.github.usernameAvailability(selected ? trimmedValue : undefined, excludeSelf),
    queryFn: async () => (await githubApi.checkUsernameAvailability(trimmedValue, excludeSelf)).data,
    enabled: Boolean(selected && trimmedValue && !disabled),
    retry: false,
    staleTime: 10_000,
  });

  const availabilityError = availabilityQuery.data?.available === false
    ? availabilityQuery.data.errors[0] || 'GitHub username is already used.'
    : '';
  const selectedAndAvailable = selected && availabilityQuery.data?.available !== false && !availabilityQuery.isError;
  const hasError = Boolean(
    trimmedValue &&
    (!formatValid || searchQuery.isError || (selectedLogin && !selectedFormatValid) || availabilityError || availabilityQuery.isError)
  );

  const helperText = useMemo(() => {
    if (!trimmedValue) return '';
    if (!formatValid) return 'Use username, name, or email characters only.';
    if (searchQuery.isFetching) return 'Searching GitHub...';
    if (searchQuery.isError) return getLookupError(searchQuery.error);
    if (selected && availabilityQuery.isFetching) return 'Checking GitHub username availability...';
    if (selected && availabilityQuery.isError) return 'Could not check GitHub username availability.';
    if (availabilityError) return availabilityError;
    if (selected) return '';
    if (results.length > 0) return 'Select a GitHub account below to confirm.';
    if (debouncedQuery) return 'No GitHub users found.';
    return '';
  }, [
    availabilityError,
    availabilityQuery.isError,
    availabilityQuery.isFetching,
    debouncedQuery,
    formatValid,
    results.length,
    searchQuery.error,
    searchQuery.isError,
    searchQuery.isFetching,
    selected,
    trimmedValue,
  ]);

  useEffect(() => {
    if (selectedLogin && selectedLogin.toLowerCase() !== trimmedValue.toLowerCase()) {
      setSelectedLogin('');
    }
  }, [selectedLogin, trimmedValue]);

  useEffect(() => {
    onValidityChange?.(!trimmedValue || selectedAndAvailable);
  }, [onValidityChange, selectedAndAvailable, trimmedValue]);

  const selectProfile = (profile: GitHubUserProfile) => {
    setSelectedLogin(profile.login);
    onChange(profile.login);
    onSelect?.(profile);
  };

  return (
    <div className="relative space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9"
          maxLength={39}
          aria-invalid={hasError}
        />
        {searchQuery.isFetching || availabilityQuery.isFetching ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : selectedAndAvailable ? (
          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
        ) : hasError ? (
          <XCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-600" />
        ) : null}
      </div>

      {helperText && (
        <p className={`text-xs ${hasError ? 'text-red-600' : selectedAndAvailable ? 'text-green-700' : 'text-muted-foreground'}`}>
          {helperText}
        </p>
      )}

      {results.length > 0 && !selected && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-md border bg-white shadow-lg">
          {results.map((profile) => (
            <button
              key={profile.id || profile.login}
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent"
              onClick={() => selectProfile(profile)}
              disabled={disabled}
            >
              <Avatar className="h-10 w-10 border">
                {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.login} />}
                <AvatarFallback>{profile.login.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {profile.name || profile.login}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  @{profile.login}
                  {profile.email ? ` - ${profile.email}` : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
