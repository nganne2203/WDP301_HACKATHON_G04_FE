import { Loader2, Send } from 'lucide-react';

import type { Round, Submission } from '@/shared/api/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { normalizeUrl, type SubmissionFormState } from '../model/submission-form';

export function SubmissionDialog({
  open,
  onOpenChange,
  submitConfirmOpen,
  onSubmitConfirmOpenChange,
  selectedRound,
  currentSubmission,
  gateMessage,
  form,
  setForm,
  saveDraftPending,
  submitPending,
  onSaveDraft,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitConfirmOpen: boolean;
  onSubmitConfirmOpenChange: (open: boolean) => void;
  selectedRound: Round | null;
  currentSubmission: Submission | null;
  gateMessage: string;
  form: SubmissionFormState;
  setForm: React.Dispatch<React.SetStateAction<SubmissionFormState>>;
  saveDraftPending: boolean;
  submitPending: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  const locked = currentSubmission?.status === 'ACCEPTED' || currentSubmission?.status === 'REJECTED';
  const editable = !locked && !gateMessage;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRound?.name || 'Submission'}</DialogTitle>
            <DialogDescription>Attach the links your team wants judges to review for this round.</DialogDescription>
          </DialogHeader>
          {selectedRound && (
            <div className="space-y-4 py-2">
              <SubmissionInput disabled={!editable} id="submission-demo" label="Demo URL" value={form.demoUrl} onChange={(value) => setForm((current) => ({ ...current, demoUrl: value }))} />
              <SubmissionInput disabled={!editable} id="submission-report" label="Report URL" value={form.reportUrl} onChange={(value) => setForm((current) => ({ ...current, reportUrl: value }))} />
              <SubmissionInput disabled={!editable} id="submission-presentation" label="Presentation URL" value={form.presentationUrl} onChange={(value) => setForm((current) => ({ ...current, presentationUrl: value }))} />

              {!editable ? (
                <Alert>
                  <AlertTitle>{locked ? 'Submission locked' : 'Submission window closed'}</AlertTitle>
                  <AlertDescription>
                    {locked ? 'This submission has already been reviewed and can no longer be edited.' : gateMessage}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={onSaveDraft} disabled={saveDraftPending}>
                    {saveDraftPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save changes'}
                  </Button>
                  <Button
                    onClick={() => onSubmitConfirmOpenChange(true)}
                    disabled={submitPending || (!normalizeUrl(form.demoUrl) && !normalizeUrl(form.reportUrl) && !normalizeUrl(form.presentationUrl))}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={submitConfirmOpen} onOpenChange={onSubmitConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit artifacts</AlertDialogTitle>
            <AlertDialogDescription>
              Submit the artifacts for <strong>{selectedRound?.name}</strong>? You can still update them until the submission deadline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onSubmit}>
              {submitPending ? 'Submitting...' : 'Confirm Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SubmissionInput({
  disabled,
  id,
  label,
  value,
  onChange,
}: {
  disabled: boolean;
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} disabled={disabled} onChange={(competition) => onChange(competition.target.value)} placeholder="https://..." />
    </div>
  );
}
