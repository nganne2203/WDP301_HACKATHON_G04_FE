import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';

import { authApi } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

export function ResetPasswordView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const newPasswordTooShort = newPassword.length > 0 && newPassword.length < 8;
  const confirmPasswordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const confirmPasswordMatched = confirmPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;
  const canSubmit = Boolean(token && newPassword.length >= 8 && confirmPasswordMatched && !submitting);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error('Reset link is missing a token.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      toast.success('Password reset successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error('Could not reset password', { description: error.firstError });
      } else {
        toast.error('Connection failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-gray-200">
        <CardHeader>
          <div className="w-11 h-11 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
            <LockKeyhole className="w-5 h-5" />
          </div>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a new password for your SEAL Hackathon account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600">This reset link is missing a token.</p>
              <Button asChild className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    className="pr-10"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    aria-invalid={newPasswordTooShort}
                    aria-describedby={newPasswordTooShort ? 'newPassword-error' : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowNewPassword((value) => !value)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPasswordTooShort && (
                  <p id="newPassword-error" className="text-xs text-destructive">
                    Password must be at least 8 characters.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="pr-10"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    aria-invalid={confirmPasswordMismatch}
                    aria-describedby={confirmPasswordMismatch ? 'confirmPassword-error' : confirmPasswordMatched ? 'confirmPassword-success' : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPasswordMismatch && (
                  <p id="confirmPassword-error" className="text-xs text-destructive">
                    Passwords do not match.
                  </p>
                )}
                {confirmPasswordMatched && (
                  <p id="confirmPassword-success" className="text-xs text-green-600">
                    Passwords match.
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={!canSubmit}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
