import type { User as ApiUser } from '@/shared/api/types';
import type { AppRole } from '@/entities/session/model/store';

const appRoleHomePaths: Record<AppRole, string> = {
  admin: '/admin',
  coordinator: '/coordinator',
  judge: '/judge',
  mentor: '/mentor',
  speaker: '/mentor',
  participant: '/participant',
};

const appRoleLabels: Record<AppRole, string> = {
  admin: 'Administrator',
  coordinator: 'Event Coordinator',
  judge: 'Judge',
  mentor: 'Mentor',
  speaker: 'Speaker',
  participant: 'Participant',
};

export function resolveHomePathForRole(role: AppRole | null | undefined) {
  if (!role) return '/participant';
  return appRoleHomePaths[role] || '/participant';
}

export function resolveHomePathForUser(user: Pick<ApiUser, 'roles' | 'mustChangePassword'>) {
  if (user.mustChangePassword) return '/change-password';

  const roleNames = user.roles.map((role) => role.name?.toUpperCase()).filter(Boolean);

  if (roleNames.includes('ADMIN')) return '/admin';
  if (roleNames.includes('EVENT_COORDINATOR') || roleNames.includes('COORDINATOR')) return '/coordinator';
  if (roleNames.includes('JUDGE')) return '/judge';
  if (roleNames.includes('MENTOR')) return '/mentor';
  if (roleNames.includes('SPEAKER')) return '/mentor';

  return '/participant';
}

export function getRoleLabel(role: AppRole | null | undefined) {
  if (!role) return '';
  return appRoleLabels[role] ?? role;
}
