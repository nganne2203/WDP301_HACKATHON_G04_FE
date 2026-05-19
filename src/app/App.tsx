import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
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
import { ParticipantDashboard } from './pages/participant/Dashboard';
import { ParticipantTeam } from './pages/participant/Team';
import { MentorTeams } from './pages/mentor/Teams';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { useStore } from '../store/useStore';

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useStore();

  if (!user) {
    return <Navigate to="/login" replace />;
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Coordinator Routes */}
        <Route
          path="/coordinator"
          element={
            <AppLayout>
              <CoordinatorDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/events"
          element={
            <AppLayout>
              <Events />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/participants"
          element={
            <AppLayout>
              <Participants />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/teams"
          element={
            <AppLayout>
              <Teams />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/checkin"
          element={
            <AppLayout>
              <Checkin />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/repos"
          element={
            <AppLayout>
              <Repositories />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/judging"
          element={
            <AppLayout>
              <Judging />
            </AppLayout>
          }
        />
        <Route
          path="/coordinator/results"
          element={
            <AppLayout>
              <Results />
            </AppLayout>
          }
        />

        {/* Judge Routes */}
        <Route
          path="/judge"
          element={
            <AppLayout>
              <JudgeScoring />
            </AppLayout>
          }
        />
        <Route
          path="/judge/scoring"
          element={
            <AppLayout>
              <JudgeScoring />
            </AppLayout>
          }
        />

        {/* Participant Routes */}
        <Route
          path="/participant"
          element={
            <AppLayout>
              <ParticipantDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/participant/team"
          element={
            <AppLayout>
              <ParticipantTeam />
            </AppLayout>
          }
        />

        {/* Admin Routes — admin has full coordinator access */}
        <Route
          path="/admin"
          element={
            <AppLayout>
              <CoordinatorDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AppLayout>
              <AdminSettings />
            </AppLayout>
          }
        />

        {/* Mentor Routes */}
        <Route
          path="/mentor"
          element={
            <AppLayout>
              <ParticipantDashboard />
            </AppLayout>
          }
        />
        <Route
          path="/mentor/teams"
          element={
            <AppLayout>
              <MentorTeams />
            </AppLayout>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
