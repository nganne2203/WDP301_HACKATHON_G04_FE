import { Mail } from 'lucide-react';
import { toast } from 'sonner';
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
  function handleForgotSubmit() {
    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    toast.error('Password reset is not available yet', {
      description: 'The backend does not expose a reset-password email flow in this build.',
    });
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
            Password reset email is not connected to a backend endpoint in this build.
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
            <Button className="flex-1" onClick={handleForgotSubmit}>
              Send Reset Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
