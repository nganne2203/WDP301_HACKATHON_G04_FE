import type { CreateUserRequest, UpdateUserRequest, User, UserRoleName, UserStatus } from '@/shared/api/types';

export const participantUserRoleOptions: UserRoleName[] = [
  'PARTICIPANT',
  'USER',
  'MENTOR',
  'SPEAKER',
  'JUDGE',
  'COORDINATOR',
  'EVENT_COORDINATOR',
  'ADMIN',
];

export const participantUserStatusOptions: UserStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export interface ParticipantUserFormState {
  email: string;
  password: string;
  fullName: string;
  roles: UserRoleName[];
  status: UserStatus;
  phone: string;
  bio: string;
  githubUsername: string;
  studentType: 'FPT' | 'EXTERNAL';
  studentId: string;
  schoolName: string;
}

export function createEmptyParticipantUserForm(): ParticipantUserFormState {
  return {
    email: '',
    password: '',
    fullName: '',
    roles: ['PARTICIPANT'],
    status: 'PENDING',
    phone: '',
    bio: '',
    githubUsername: '',
    studentType: 'FPT',
    studentId: '',
    schoolName: '',
  };
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function userNeedsStudentInfo(form: Pick<ParticipantUserFormState, 'roles'>) {
  return form.roles.some((role) => role === 'USER' || role === 'PARTICIPANT');
}

export function mapUserToParticipantUserForm(user: User): ParticipantUserFormState {
  return {
    email: user.email,
    password: '',
    fullName: user.fullName,
    roles: user.roles
      .map((role) => (role.name || role.code) as UserRoleName | undefined)
      .filter((role): role is UserRoleName => Boolean(role)),
    status: user.status,
    phone: user.phone || '',
    bio: user.bio || '',
    githubUsername: user.githubUsername || '',
    studentType: user.studentType || 'FPT',
    studentId: user.studentId || '',
    schoolName: user.schoolName || '',
  };
}

export function toggleUserRole(roles: UserRoleName[], role: UserRoleName) {
  const nextRoles = roles.includes(role) ? roles.filter((value) => value !== role) : [...roles, role];
  return nextRoles.length > 0 ? nextRoles : roles;
}

function buildSharedUserPayload(form: ParticipantUserFormState) {
  const needsStudentInfo = userNeedsStudentInfo(form);
  return {
    email: form.email.trim().toLowerCase(),
    fullName: form.fullName.trim(),
    roles: form.roles,
    phone: normalizeOptionalText(form.phone),
    bio: normalizeOptionalText(form.bio),
    githubUsername: normalizeOptionalText(form.githubUsername),
    studentType: needsStudentInfo ? form.studentType : undefined,
    studentId: needsStudentInfo ? normalizeOptionalText(form.studentId) : undefined,
    schoolName: needsStudentInfo && form.studentType === 'EXTERNAL' ? normalizeOptionalText(form.schoolName) : undefined,
  };
}

export function buildCreateUserPayload(form: ParticipantUserFormState): CreateUserRequest {
  return {
    ...buildSharedUserPayload(form),
    password: form.password,
    status: form.status,
  };
}

export function buildUpdateUserPayload(form: ParticipantUserFormState): UpdateUserRequest {
  return buildSharedUserPayload(form);
}
