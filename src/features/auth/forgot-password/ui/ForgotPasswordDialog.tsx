import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface ForgotPasswordDialogProps {
  email: string;
  open: boolean;
  onEmailChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordDialog({
  email,
  open,
  onEmailChange,
  onOpenChange,
}: ForgotPasswordDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleForgotSubmit() {
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      toast.success('Check your email', {
        description: 'If this email exists, a password reset link has been sent.',
      });
      handleClose();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error('Could not send reset link', { description: error.firstError });
      } else {
        toast.error('Connection failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
    onEmailChange('');
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email and we will send a password reset link if the account exists.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-1 space-y-4">
          <div>
            <Label htmlFor="forgot-email">Email address</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@university.edu"
                className="pl-9"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleForgotSubmit()}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={submitting} onClick={handleForgotSubmit}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
