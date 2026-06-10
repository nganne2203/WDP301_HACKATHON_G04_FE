import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  ClipboardCheck,
  Github,
  Images,
  LayoutDashboard,
  Scale,
  Settings,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react';
import type { AppRole } from '@/entities/session/model/store';

export interface NavigationItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const coordinatorNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/coordinator' },
  { icon: Calendar, label: 'Events', href: '/coordinator/events' },
  { icon: Users, label: 'Participants', href: '/coordinator/participants' },
  { icon: UsersRound, label: 'Teams', href: '/coordinator/teams' },
  { icon: ClipboardCheck, label: 'Check-in', href: '/coordinator/checkin' },
  { icon: Github, label: 'Repositories', href: '/coordinator/repos' },
  { icon: Scale, label: 'Judging', href: '/coordinator/judging' },
  { icon: Trophy, label: 'Results', href: '/coordinator/results' },
  { icon: Images, label: 'Media', href: '/coordinator/media' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

const judgeNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/judge' },
  { icon: Scale, label: 'Score Teams', href: '/judge/scoring' },
];

const participantNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/participant' },
  { icon: UsersRound, label: 'My Team', href: '/participant/team' },
  { icon: Images, label: 'Media', href: '/participant/media' },
];

const mentorNavigation: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/mentor' },
  { icon: UsersRound, label: 'My Teams', href: '/mentor/teams' },
];

export function getNavigationItems(role: AppRole | null | undefined) {
  if (role === 'coordinator' || role === 'admin') return coordinatorNavigation;
  if (role === 'judge') return judgeNavigation;
  if (role === 'mentor') return mentorNavigation;
  return participantNavigation;
}
