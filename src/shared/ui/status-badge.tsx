import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/cn';

type Status =
  | 'draft'
  | 'open_registration'
  | 'registration_closed'
  | 'ongoing'
  | 'scoring'
  | 'completed'
  | 'archived'
  | 'active'
  | 'registered'
  | 'withdrawn'
  | 'checked_in'
  | 'granted'
  | 'not_granted'
  | 'revoked'
  | 'submitted'
  | 'pending'
  | 'assigned';

const statusConfig: Record<Status, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  open_registration: { label: 'Open Registration', variant: 'default' },
  registration_closed: { label: 'Registration Closed', variant: 'secondary' },
  ongoing: { label: 'Ongoing', variant: 'default' },
  scoring: { label: 'Scoring', variant: 'default' },
  completed: { label: 'Completed', variant: 'outline' },
  archived: { label: 'Archived', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  registered: { label: 'Registered', variant: 'secondary' },
  withdrawn: { label: 'Withdrawn', variant: 'destructive' },
  checked_in: { label: 'Checked In', variant: 'default' },
  granted: { label: 'Granted', variant: 'default' },
  not_granted: { label: 'Not Granted', variant: 'secondary' },
  revoked: { label: 'Revoked', variant: 'destructive' },
  submitted: { label: 'Submitted', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
  assigned: { label: 'Assigned', variant: 'default' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {config.label}
    </Badge>
  );
}
