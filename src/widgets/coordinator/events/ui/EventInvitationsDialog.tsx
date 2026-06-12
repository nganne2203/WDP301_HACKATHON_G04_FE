import { Loader2, Mail } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

export function EventInvitationsDialog({
  open,
  onOpenChange,
  eventTitle,
  inviteEmails,
  setInviteEmails,
  inviteMessage,
  setInviteMessage,
  pending,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle?: string;
  inviteEmails: string;
  setInviteEmails: (value: string) => void;
  inviteMessage: string;
  setInviteMessage: (value: string) => void;
  pending: boolean;
  onSend: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Event Invitations
          </DialogTitle>
          <DialogDescription>
            Send registration invitation emails for {eventTitle || 'this event'}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-emails">Recipient emails</Label>
            <Textarea
              id="invite-emails"
              rows={5}
              placeholder="participant1@example.com, participant2@example.com"
              value={inviteEmails}
              onChange={(event) => setInviteEmails(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-message">Message</Label>
            <Textarea
              id="invite-message"
              rows={3}
              placeholder="Optional invitation message"
              value={inviteMessage}
              onChange={(event) => setInviteMessage(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSend} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitations'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
