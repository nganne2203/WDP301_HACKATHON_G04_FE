import { z } from 'zod';
import type { CreateEventRequest, Event, EventStatus } from '@/shared/api/types';

export const eventStatusOptions: { value: EventStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN_REGISTRATION', label: 'Open Registration' },
  { value: 'REGISTRATION_CLOSED', label: 'Registration Closed' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'SCORING', label: 'Scoring' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const eventFormSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  semester: z.string().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.startDate || !data.endDate) return;

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

  if (end < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'End date cannot be earlier than start date',
    });
  }
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

export function toCreateEventRequest(data: EventFormValues): CreateEventRequest {
  return {
    title: data.title,
    description: data.description || undefined,
    semester: data.semester || undefined,
    startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    status: (data.status as EventStatus) || 'DRAFT',
  };
}

export function toUpdateEventRequest(data: EventFormValues): Partial<CreateEventRequest> {
  return {
    title: data.title,
    description: data.description || undefined,
    semester: data.semester || undefined,
    startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
    endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
    status: (data.status as EventStatus) || undefined,
  };
}

export function toEditEventFormValues(event: Event): EventFormValues {
  return {
    title: event.title,
    description: event.description || '',
    semester: event.semester || '',
    startDate: event.startDate ? event.startDate.split('T')[0] : '',
    endDate: event.endDate ? event.endDate.split('T')[0] : '',
    status: event.status,
  };
}

export function parseInviteEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export function formatEventDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export function mapEventStatus(status: EventStatus) {
  return status.toLowerCase();
}

export function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
