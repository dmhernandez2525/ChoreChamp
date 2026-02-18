import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoAuthProvider, useDemoAuth } from './context/DemoAuthContext';
import { CelebrationProvider } from './components/celebrations';
import { PWAProvider } from './components/pwa';
import { AccessibilityProvider } from './components/accessibility';
import { AppShell } from './components/app/AppShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import HouseholdDashboardWrapper from './pages/HouseholdDashboardWrapper';
import RewardsStoreWrapper from './pages/RewardsStoreWrapper';
import LeaderboardWrapper from './pages/LeaderboardWrapper';
import CreateHousehold from './pages/CreateHousehold';
import JoinHousehold from './pages/JoinHousehold';
import FamilyManagement from './pages/FamilyManagement';
import Settings from './pages/Settings';
import HouseholdSettings from './pages/HouseholdSettings';
import CreateChore from './pages/CreateChore';
import EditChore from './pages/EditChore';
import TemplateBrowser from './pages/TemplateBrowser';
import MemberPoints from './pages/MemberPoints';
import CreateReward from './pages/CreateReward';
import EditReward from './pages/EditReward';
import MemberBadges from './pages/MemberBadges';
import MemberStreaks from './pages/MemberStreaks';
import BossBattle from './pages/BossBattle';
import NotificationCenter from './pages/NotificationCenter';
import Activity from './pages/Activity';
import Reports from './pages/Reports';
import MemberCharacter from './pages/MemberCharacter';
import MemberPets from './pages/MemberPets';
import Arcade from './pages/Arcade';
import Collection from './pages/Collection';
import SchoolExtracurricular from './pages/SchoolExtracurricular';
import Subscription from './pages/Subscription';
import Analytics from './pages/Analytics';
import Support from './pages/Support';
import InAppStore from './pages/InAppStore';
import EnterpriseSchoolEdition from './pages/EnterpriseSchoolEdition';
import ApiPlatformIntegrations from './pages/ApiPlatformIntegrations';

// Protected route wrapper - allows demo mode OR real auth
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDemoMode } = useDemoAuth();

  // Allow access if in demo mode
  if (isDemoMode) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Auth route wrapper (redirects authenticated users to dashboard)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-gray-600">Page not found</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page - always accessible */}
      <Route path="/" element={<Landing />} />

      {/* Auth routes - redirect to dashboard if already logged in */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthRoute>
            <SignUp />
          </AuthRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/new"
        element={
          <ProtectedRoute>
            <CreateHousehold />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/join"
        element={
          <ProtectedRoute>
            <JoinHousehold />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId"
        element={
          <ProtectedRoute>
            <HouseholdDashboardWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/members"
        element={
          <ProtectedRoute>
            <FamilyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/settings"
        element={
          <ProtectedRoute>
            <HouseholdSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/subscription"
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/chores/new"
        element={
          <ProtectedRoute>
            <CreateChore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/chores/:choreId/edit"
        element={
          <ProtectedRoute>
            <EditChore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/templates"
        element={
          <ProtectedRoute>
            <TemplateBrowser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/members/:memberId/points"
        element={
          <ProtectedRoute>
            <MemberPoints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/rewards"
        element={
          <ProtectedRoute>
            <RewardsStoreWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/rewards/new"
        element={
          <ProtectedRoute>
            <CreateReward />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/rewards/:rewardId/edit"
        element={
          <ProtectedRoute>
            <EditReward />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/members/:memberId/badges"
        element={
          <ProtectedRoute>
            <MemberBadges />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/members/:memberId/streaks"
        element={
          <ProtectedRoute>
            <MemberStreaks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/leaderboard"
        element={
          <ProtectedRoute>
            <LeaderboardWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/boss-battle"
        element={
          <ProtectedRoute>
            <BossBattle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/activity"
        element={
          <ProtectedRoute>
            <Activity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/members/:memberId/character"
        element={
          <ProtectedRoute>
            <MemberCharacter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/members/:memberId/pets"
        element={
          <ProtectedRoute>
            <MemberPets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/arcade"
        element={
          <ProtectedRoute>
            <Arcade />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/collection"
        element={
          <ProtectedRoute>
            <Collection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/school"
        element={
          <ProtectedRoute>
            <SchoolExtracurricular />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/support"
        element={
          <ProtectedRoute>
            <Support />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/store"
        element={
          <ProtectedRoute>
            <InAppStore />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/enterprise"
        element={
          <ProtectedRoute>
            <EnterpriseSchoolEdition />
          </ProtectedRoute>
        }
      />
      <Route
        path="/households/:householdId/developer"
        element={
          <ProtectedRoute>
            <ApiPlatformIntegrations />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <DemoAuthProvider>
      <AuthProvider>
        <CelebrationProvider>
          <PWAProvider>
            <AccessibilityProvider>
              <AppShell>
                <AppRoutes />
              </AppShell>
            </AccessibilityProvider>
          </PWAProvider>
        </CelebrationProvider>
      </AuthProvider>
    </DemoAuthProvider>
  );
}
