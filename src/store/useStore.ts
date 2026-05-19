import { create } from 'zustand';

export type UserRole = 'admin' | 'coordinator' | 'judge' | 'mentor' | 'team_leader' | 'participant';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export interface Event {
  id: string;
  title: string;
  semester: string;
  status: 'draft' | 'open_registration' | 'ongoing' | 'scoring' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  maxTeams: number;
}

interface AppState {
  user: User | null;
  selectedEvent: Event | null;
  sidebarCollapsed: boolean;
  setUser: (user: User | null) => void;
  setSelectedEvent: (event: Event | null) => void;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  selectedEvent: null,
  sidebarCollapsed: false,
  setUser: (user) => set({ user }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
