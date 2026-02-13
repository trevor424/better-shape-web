import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import NutritionPage from '@/pages/nutrition/NutritionPage';
import WorkoutPage from '@/pages/workout/WorkoutPage';
import ProgressPage from '@/pages/progress/ProgressPage';
import ProfilePage from '@/pages/profile/ProfilePage';

// ── Auth Gate ────────────────────────────────────────────────────────
// Protects routes that require authentication + completed onboarding.

function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const profile = useUserStore((s) => s.profile);

  // Still determining auth state — show a loading indicator
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="text-dark-300 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  // Logged in but hasn't completed onboarding — redirect to onboarding
  if (!profile || !profile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  // Authenticated and onboarding complete — render protected content
  return <>{children}</>;
}

// ── App ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Auth routes (login / register) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Onboarding (standalone, no layout wrapper needed) */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Protected app routes */}
        <Route
          element={
            <AuthGate>
              <MainLayout />
            </AuthGate>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="workout" element={<WorkoutPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all — redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
