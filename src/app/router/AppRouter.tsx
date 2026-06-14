import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/app/layouts/AppShell';
import { resolveHomePathForRole } from '@/entities/session/lib/navigation';
import { useStore } from '@/entities/session/model/store';
import type { AppRole } from '@/entities/session/model/store';
import { useAuthBootstrapQuery } from '@/hooks/queries/useAuthQueries';

const Login = lazy(async () => ({ default: (await import('@/pages/Login')).Login }));
const Register = lazy(async () => ({ default: (await import('@/pages/Register')).Register }));
const GoogleCallback = lazy(async () => ({ default: (await import('@/pages/GoogleCallback')).GoogleCallback }));
const ChangePassword = lazy(async () => ({ default: (await import('@/pages/ChangePassword')).ChangePassword }));
const TeamInvitationConfirmation = lazy(async () => ({
  default: (await import('@/pages/TeamInvitationConfirmation')).TeamInvitationConfirmation,
}));
const EventGallery = lazy(async () => ({ default: (await import('@/pages/EventGallery')).EventGallery }));
const CoordinatorDashboard = lazy(async () => ({
  default: (await import('@/pages/coordinator/Dashboard')).CoordinatorDashboard,
}));
const Events = lazy(async () => ({ default: (await import('@/pages/coordinator/Events')).Events }));
const Rounds = lazy(async () => ({ default: (await import('@/pages/coordinator/Rounds')).Rounds }));
const Rubrics = lazy(async () => ({ default: (await import('@/pages/coordinator/Rubrics')).Rubrics }));
const Tracks = lazy(async () => ({ default: (await import('@/pages/coordinator/Tracks')).Tracks }));
const Timelines = lazy(async () => ({ default: (await import('@/pages/coordinator/Timelines')).Timelines }));
const Workshops = lazy(async () => ({ default: (await import('@/pages/coordinator/Workshops')).Workshops }));
const Participants = lazy(async () => ({
  default: (await import('@/pages/coordinator/Participants')).Participants,
}));
const Teams = lazy(async () => ({ default: (await import('@/pages/coordinator/Teams')).Teams }));
const Checkin = lazy(async () => ({ default: (await import('@/pages/coordinator/Checkin')).Checkin }));
const Repositories = lazy(async () => ({
  default: (await import('@/pages/coordinator/Repositories')).Repositories,
}));
const Judging = lazy(async () => ({ default: (await import('@/pages/coordinator/Judging')).Judging }));
const Results = lazy(async () => ({ default: (await import('@/pages/coordinator/Results')).Results }));
const AdminMedia = lazy(async () => ({ default: (await import('@/pages/admin/Media')).AdminMedia }));
const AdminAuditLogs = lazy(async () => ({ default: (await import('@/pages/admin/AuditLogs')).AdminAuditLogs }));
const AdminOperations = lazy(async () => ({ default: (await import('@/pages/admin/Operations')).AdminOperations }));
const JudgeScoring = lazy(async () => ({ default: (await import('@/pages/judge/Scoring')).JudgeScoring }));
const AdminSettings = lazy(async () => ({ default: (await import('@/pages/admin/Settings')).Settings }));
const ParticipantDashboard = lazy(async () => ({
  default: (await import('@/pages/participant/Dashboard')).ParticipantDashboard,
}));
const ParticipantTeam = lazy(async () => ({
  default: (await import('@/pages/participant/Team')).ParticipantTeam,
}));
const ParticipantSubmissions = lazy(async () => ({
  default: (await import('@/pages/participant/Submissions')).ParticipantSubmissions,
}));
const ParticipantResults = lazy(async () => ({
  default: (await import('@/pages/participant/Results')).ParticipantResults,
}));
const ParticipantMedia = lazy(async () => ({
  default: (await import('@/pages/participant/Media')).ParticipantMedia,
}));
const MentorDashboard = lazy(async () => ({
  default: (await import('@/pages/mentor/Dashboard')).MentorDashboard,
}));
const MentorTeams = lazy(async () => ({ default: (await import('@/pages/mentor/Teams')).MentorTeams }));

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: AppRole[] }) {
  const user = useStore((state) => state.user);
  const appRole = useStore((state) => state.appRole);
  const isAuthLoading = useStore((state) => state.isAuthLoading);
  const location = useLocation();

  if (isAuthLoading) return <AuthLoading />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && appRole && !allowedRoles.includes(appRole)) {
    return <Navigate to={resolveHomePathForRole(appRole)} replace />;
  }

  return <AppShell>{children}</AppShell>;
}

function AuthInitializer({ children }: { children: ReactNode }) {
  const isAuthLoading = useStore((state) => state.isAuthLoading);
  const authQuery = useAuthBootstrapQuery();

  if (isAuthLoading || authQuery.isPending) return <AuthLoading />;

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/team-invitations/confirm" element={<TeamInvitationConfirmation />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          <Route
            path="/coordinator"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/events"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/participants"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Participants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/rounds"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Rounds />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/rubrics"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Rubrics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/tracks"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Tracks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/timelines"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Timelines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/workshops"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Workshops />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/teams"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/checkin"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Checkin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/repos"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Repositories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/judging"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Judging />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/results"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/media"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
                <AdminMedia />
              </ProtectedRoute>
            }
          />

          <Route
            path="/judge"
            element={
              <ProtectedRoute allowedRoles={['judge', 'admin']}>
                <JudgeScoring />
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge/scoring"
            element={
              <ProtectedRoute allowedRoles={['judge', 'admin']}>
                <JudgeScoring />
              </ProtectedRoute>
            }
          />

          <Route
            path="/participant"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant/team"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <ParticipantTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant/submissions"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <ParticipantSubmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant/results"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <ParticipantResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/participant/media"
            element={
              <ProtectedRoute allowedRoles={['participant', 'admin']}>
                <ParticipantMedia />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/gallery"
            element={
              <ProtectedRoute>
                <EventGallery />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMedia />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/operations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOperations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mentor"
            element={
              <ProtectedRoute allowedRoles={['mentor', 'admin']}>
                <MentorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentor/teams"
            element={
              <ProtectedRoute allowedRoles={['mentor', 'admin']}>
                <MentorTeams />
              </ProtectedRoute>
            }
          />
          </Routes>
        </Suspense>
      </AuthInitializer>
    </BrowserRouter>
  );
}
