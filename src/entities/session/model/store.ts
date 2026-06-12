import { create } from 'zustand';
import type { User as ApiUser, UserRoleName } from '@/shared/api/types';
import { clearTokens, getAccessToken, setTokens } from '@/shared/api/client';
import { authApi } from '@/shared/api/auth';

// ============================================================
// Derived role type for frontend navigation
// ============================================================

export type AppRole = 'admin' | 'coordinator' | 'judge' | 'mentor' | 'speaker' | 'participant';

/** Maps the primary backend role to a frontend navigation role */
function deriveAppRole(user: ApiUser): AppRole {
  const roleNames = user.roles.map((r) => r.name?.toUpperCase()).filter(Boolean);

  if (roleNames.includes('ADMIN')) return 'admin';
  if (roleNames.includes('EVENT_COORDINATOR') || roleNames.includes('COORDINATOR')) return 'coordinator';
  if (roleNames.includes('JUDGE')) return 'judge';
  if (roleNames.includes('MENTOR')) return 'mentor';
  if (roleNames.includes('SPEAKER')) return 'speaker';
  return 'participant';
}

// ============================================================
// Store State
// ============================================================

interface SelectedEvent {
  id: string;
  title: string;
  semester: string;
  status: string;
}

interface AuthState {
  /** The authenticated backend user (null = not logged in) */
  user: ApiUser | null;
  /** Derived navigation role */
  appRole: AppRole | null;
  /** Whether initial auth check is still in progress */
  isAuthLoading: boolean;

  /** Currently selected event for the topbar */
  selectedEvent: SelectedEvent | null;
  sidebarCollapsed: boolean;

  // Actions
  setAuth: (user: ApiUser, accessToken: string, refreshToken: string) => void;
  setUser: (user: ApiUser | null) => void;
  logout: () => Promise<void>;
  /** Check if current user has a backend role name */
  hasRole: (role: UserRoleName) => boolean;
  /** Check if current user has a specific permission code */
  hasPermission: (permission: string) => boolean;
  /** Fetch the current user from GET /auth/me and refresh the store */
  fetchCurrentUser: () => Promise<void>;
  setSelectedEvent: (event: SelectedEvent | null) => void;
  toggleSidebar: () => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useStore = create<AuthState>((set, get) => ({
  user: null,
  appRole: null,
  isAuthLoading: true,
  selectedEvent: null,
  sidebarCollapsed: false,

  setAuth: (user, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    set({ user, appRole: deriveAppRole(user), isAuthLoading: false });
  },

  setUser: (user) => {
    if (user) {
      set({ user, appRole: deriveAppRole(user) });
    } else {
      clearTokens();
      set({ user: null, appRole: null, selectedEvent: null });
    }
  },

  logout: async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await authApi.logout();
      }
    } catch {
      // Ignore errors on logout
    } finally {
      clearTokens();
      set({ user: null, appRole: null, selectedEvent: null, isAuthLoading: false });
    }
  },

  hasRole: (role) => {
    const { user } = get();
    if (!user) return false;
    return user.roles.some((r) => r.name?.toUpperCase() === role);
  },

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    return user.permissions.includes(permission);
  },

  fetchCurrentUser: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, appRole: null, isAuthLoading: false });
      return;
    }

    try {
      const response = await authApi.getMe();
      const user = response.data;
      set({ user, appRole: deriveAppRole(user), isAuthLoading: false });
    } catch {
      clearTokens();
      set({ user: null, appRole: null, isAuthLoading: false });
    }
  },

  setSelectedEvent: (event) => set({ selectedEvent: event }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
}));

// Re-export old types for backward compatibility during transition
export type UserRole = AppRole | 'team_leader';

// Legacy User type for components that still use the old interface
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

// Legacy Event type for backward compatibility
export interface Event {
  id: string;
  title: string;
  semester: string;
  status: 'draft' | 'open_registration' | 'ongoing' | 'scoring' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  maxTeams: number;
}
