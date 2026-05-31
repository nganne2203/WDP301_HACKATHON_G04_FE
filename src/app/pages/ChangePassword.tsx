import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';
import { useStore } from '../../store/useStore';

export function ChangePassword() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      const response = await authApi.changePassword({ currentPassword, newPassword });
      setUser(response.data);
      toast.success('Password changed successfully');
      navigate('/participant', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error('Could not change password', { description: error.firstError });
      } else {
        toast.error('Could not connect to server.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 min-h-full flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="w-11 h-11 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
            <LockKeyhole className="w-5 h-5" />
          </div>
          <CardTitle>Change temporary password</CardTitle>
          <CardDescription>
            Your invited account uses a temporary password. Set a new password before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
