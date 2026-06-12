import { ApiError } from '@/shared/api/client';
import type { Submission } from '@/shared/api/types';

export interface SubmissionFormState {
  demoUrl: string;
  reportUrl: string;
  presentationUrl: string;
}

export function createSubmissionForm(): SubmissionFormState {
  return {
    demoUrl: '',
    reportUrl: '',
    presentationUrl: '',
  };
}

export function mapSubmissionToForm(submission: Submission): SubmissionFormState {
  return {
    demoUrl: submission.demoUrl || '',
    reportUrl: submission.reportUrl || '',
    presentationUrl: submission.presentationUrl || '',
  };
}

export function normalizeUrl(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getSubmissionErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Please try again.';
}
