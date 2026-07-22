import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  Code,
  FileText,
  GitBranch,
  Github,
  Images,
  LayoutDashboard,
  KeyRound,
  Presentation,
  Scale,
  Send,
  Server,
  Trophy,
  MessageSquare,
  Users,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { AppRole } from '@/entities/session/model/store';

export interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}

const coordinatorNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/coordinator' },
  { icon: Calendar, label: 'Competitions', href: '/coordinator/competitions' },
  { icon: GitBranch, label: 'Tracks', href: '/coordinator/tracks' },
  { icon: Calendar, label: 'Rounds', href: '/coordinator/rounds' },
  { icon: FileText, label: 'Rubrics', href: '/coordinator/rubrics' },
  { icon: Clock3, label: 'Timelines', href: '/coordinator/timelines' },
  { icon: Presentation, label: 'Workshops', href: '/coordinator/workshops' },
  { icon: Users, label: 'Users', href: '/coordinator/participants' },
  { icon: UsersRound, label: 'Teams', href: '/coordinator/teams' },
  { icon: UserRound, label: 'Mentor Assignments', href: '/coordinator/mentor-assignments' },
  { icon: ClipboardCheck, label: 'Check-in', href: '/coordinator/checkin' },
  { icon: Github, label: 'Repositories', href: '/coordinator/repos' },
  { icon: Scale, label: 'Judging', href: '/coordinator/judging' },
  { icon: Trophy, label: 'Results', href: '/coordinator/results' },
  { icon: Images, label: 'Media', href: '/coordinator/media' },
];

const adminNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/coordinator' },
  { icon: Calendar, label: 'Competitions', href: '/coordinator/competitions' },
  { icon: GitBranch, label: 'Tracks', href: '/coordinator/tracks' },
  { icon: Calendar, label: 'Rounds', href: '/coordinator/rounds' },
  { icon: FileText, label: 'Rubrics', href: '/coordinator/rubrics' },
  { icon: Clock3, label: 'Timelines', href: '/coordinator/timelines' },
  { icon: Presentation, label: 'Workshops', href: '/coordinator/workshops' },
  { icon: Users, label: 'Users', href: '/coordinator/participants' },
  { icon: UsersRound, label: 'Teams', href: '/coordinator/teams' },
  { icon: UserRound, label: 'Mentor Assignments', href: '/coordinator/mentor-assignments' },
  { icon: ClipboardCheck, label: 'Check-in', href: '/coordinator/checkin' },
  { icon: Github, label: 'Repositories', href: '/coordinator/repos' },
  { icon: Scale, label: 'Judging', href: '/coordinator/judging' },
  { icon: Trophy, label: 'Results', href: '/coordinator/results' },
  { icon: Images, label: 'Media', href: '/coordinator/media' },
  { icon: KeyRound, label: 'Roles & Permissions', href: '/admin/rbac' },
  { icon: ClipboardList, label: 'Audit Logs', href: '/admin/audit-logs' },
  { icon: Server, label: 'Operations', href: '/admin/operations' },
];

const judgeNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/judge' },
  { icon: Scale, label: 'Score Teams', href: '/judge/scoring' },
  { icon: Code, label: 'Code Reviews', href: '/judge/code-reviews' },
  { icon: Trophy, label: 'Results', href: '/judge/results' },
];

const participantNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/participant' },
  { icon: UsersRound, label: 'My Team', href: '/participant/team' },
  { icon: Calendar, label: 'Rounds', href: '/participant/rounds' },
  { icon: MessageSquare, label: 'Chats', href: '/participant/chats' },
  { icon: Send, label: 'Submissions', href: '/participant/submissions' },
  { icon: Presentation, label: 'Workshops', href: '/participant/workshops' },
  { icon: Trophy, label: 'Results', href: '/participant/results' },
  { icon: Images, label: 'Media', href: '/participant/media' },
];

const mentorNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/mentor' },
  { icon: UsersRound, label: 'My Teams', href: '/mentor/teams' },
  { icon: Presentation, label: 'Workshops', href: '/mentor/workshops' },
];

const speakerNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/mentor' },
  { icon: Presentation, label: 'Workshops', href: '/mentor/workshops' },
];

export function getNavigationItems(role: AppRole | null | undefined) {
  if (role === 'admin') return adminNavigation;
  if (role === 'coordinator') return coordinatorNavigation;
  if (role === 'judge') return judgeNavigation;
  if (role === 'mentor') return mentorNavigation;
  if (role === 'speaker') return speakerNavigation;
  return participantNavigation;
}
