import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router';
import { useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { GoogleCallback } from './pages/GoogleCallback';
import { ChangePassword } from './pages/ChangePassword';
import { TeamInvitationConfirmation } from './pages/TeamInvitationConfirmation';
import { EventGallery } from './pages/EventGallery';
import { CoordinatorDashboard } from './pages/coordinator/Dashboard';
import { Events } from './pages/coordinator/Events';
import { Participants } from './pages/coordinator/Participants';
import { Teams } from './pages/coordinator/Teams';
import { Checkin } from './pages/coordinator/Checkin';
import { Repositories } from './pages/coordinator/Repositories';
import { Judging } from './pages/coordinator/Judging';
import { Results } from './pages/coordinator/Results';
import { JudgeScoring } from './pages/judge/Scoring';
import { Settings as AdminSettings } from './pages/admin/Settings';
import { AdminMedia } from './pages/admin/Media';
import { ParticipantDashboard } from './pages/participant/Dashboard';
import { ParticipantTeam } from './pages/participant/Team';
import { ParticipantMedia } from './pages/participant/Media';
import { MentorTeams } from './pages/mentor/Teams';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { useStore } from '../store/useStore';
import type { AppRole } from '../store/useStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

/** Full-screen loading spinner shown during initial auth check */
function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

/** Protected layout: requires auth + optional role gating */
function AppLayout({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: AppRole[] }) {
  const { user, appRole, isAuthLoading } = useStore();
  const location = useLocation();

  if (isAuthLoading) return <AuthLoading />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && appRole && !allowedRoles.includes(appRole)) {
    // Redirect to the user's home page if they don't have access
    const routes: Record<AppRole, string> = {
      admin: '/admin',
      coordinator: '/coordinator',
      judge: '/judge',
      mentor: '/mentor',
      speaker: '/mentor',
      participant: '/participant',
    };
    return <Navigate to={routes[appRole] || '/participant'} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

/** Initialises auth state on mount */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { fetchCurrentUser, isAuthLoading } = useStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  if (isAuthLoading) return <AuthLoading />;

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/team-invitations/confirm" element={<TeamInvitationConfirmation />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
              path="/change-password"
              element={
                <AppLayout>
                  <ChangePassword />
                </AppLayout>
              }
            />

            {/* Coordinator Routes */}
            <Route
              path="/coordinator"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <CoordinatorDashboard />
                </AppLayout>
              }
            />
            <Route
              path="/coordinator/events"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <Events />
                </AppLayout>
              }
            />
            <Route
              path="/coordinator/participants"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <Participants />
                </AppLayout>
              }
            />
            <Route
              path="/coordinator/teams"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <Teams />
                </AppLayout>
              }
            />
            <Route
              path="/coordinator/checkin"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <Checkin />
                </AppLayout>
              }
            />
            <Route
              path="/coordinator/repos"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <Repositories />
                </AppLayout>
              }
            />
            <Route
              path="/coordinator/judging"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <Judging />
                </AppLayout>
              }
            />
            <Route
              path="/coordinator/results"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <Results />
                </AppLayout>
              }
            />
            <Route
              path="/coordinator/media"
              element={
                <AppLayout allowedRoles={['coordinator', 'admin']}>
                  <AdminMedia />
                </AppLayout>
              }
            />

            {/* Judge Routes */}
            <Route
              path="/judge"
              element={
                <AppLayout allowedRoles={['judge', 'admin']}>
                  <JudgeScoring />
                </AppLayout>
              }
            />
            <Route
              path="/judge/scoring"
              element={
                <AppLayout allowedRoles={['judge', 'admin']}>
                  <JudgeScoring />
                </AppLayout>
              }
            />

            {/* Participant Routes */}
            <Route
              path="/participant"
              element={
                <AppLayout allowedRoles={['participant', 'admin']}>
                  <ParticipantDashboard />
                </AppLayout>
              }
            />
            <Route
              path="/participant/team"
              element={
                <AppLayout allowedRoles={['participant', 'admin']}>
                  <ParticipantTeam />
                </AppLayout>
              }
            />
            <Route
              path="/participant/media"
              element={
                <AppLayout allowedRoles={['participant', 'admin']}>
                  <ParticipantMedia />
                </AppLayout>
              }
            />
            <Route
              path="/events/:eventId/gallery"
              element={
                <AppLayout>
                  <EventGallery />
                </AppLayout>
              }
            />

            {/* Admin Routes — admin has full coordinator access */}
            <Route
              path="/admin"
              element={
                <AppLayout allowedRoles={['admin']}>
                  <CoordinatorDashboard />
                </AppLayout>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AppLayout allowedRoles={['admin']}>
                  <AdminSettings />
                </AppLayout>
              }
            />
            <Route
              path="/admin/media"
              element={
                <AppLayout allowedRoles={['admin']}>
                  <AdminMedia />
                </AppLayout>
              }
            />

            {/* Mentor Routes */}
            <Route
              path="/mentor"
              element={
                <AppLayout allowedRoles={['mentor', 'admin']}>
                  <ParticipantDashboard />
                </AppLayout>
              }
            />
            <Route
              path="/mentor/teams"
              element={
                <AppLayout allowedRoles={['mentor', 'admin']}>
                  <MentorTeams />
                </AppLayout>
              }
            />
          </Routes>
        </AuthInitializer>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
