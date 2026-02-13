import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  User,
  LogOut,
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

// ── Navigation items ─────────────────────────────────────────────────

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/profile', label: 'Profile', icon: User },
] as const;

// ── Main Layout ──────────────────────────────────────────────────────

export default function MainLayout() {
  const navigate = useNavigate();
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);
  const clearUser = useUserStore((s) => s.clearUser);

  function handleLogout() {
    setUnauthenticated();
    clearUser();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-dark-900">
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <span className="text-xl font-bold tracking-tight text-primary-500">
            BetterShape
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-l-3 border-primary-500 bg-primary-500/10 text-primary-400'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-dark-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-dark-300 transition-colors hover:bg-dark-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="ml-64 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
