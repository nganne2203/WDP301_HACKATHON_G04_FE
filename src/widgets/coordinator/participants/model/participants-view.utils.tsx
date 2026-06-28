import { Badge } from '@/shared/ui/badge';
import type { User, UserStatus } from '@/shared/api/types';

export type ParticipantFilterType = 'all' | 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

export function getParticipantStatusBadge(status: UserStatus) {
  const config: Record<UserStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
    APPROVED: { variant: 'default', label: 'Approved', className: 'bg-green-500 hover:bg-green-600' },
    ACTIVE: { variant: 'default', label: 'Active', className: 'bg-green-500 hover:bg-green-600' },
    PENDING: { variant: 'secondary', label: 'Pending' },
    REJECTED: { variant: 'destructive', label: 'Rejected' },
    SUSPENDED: { variant: 'outline', label: 'Suspended' },
  };

  const { variant, label, className } = config[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

export function getParticipantRoleLabels(user: User) {
  return user.roles.map((role) => role.name).join(', ') || '-';
}

export function getParticipantInitials(fullName?: string | null) {
  return fullName
    ?.split(' ')
    .map((name) => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}
