import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  User,
  LogOut,
  Menu,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    setUnauthenticated();
    clearUser();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Overlay (mobile) ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-dark-900
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo + Close button */}
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img
              src={import.meta.env.BASE_URL + 'favicon.png'}
              alt="BetterShape"
              className="h-9 w-9"
            />
            <span className="text-xl font-bold tracking-tight text-primary-500">
              BetterShape
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-300 transition-colors hover:bg-dark-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              end={'end' in rest ? rest.end : false}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:translate-x-1',
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
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Top bar with hamburger */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-dark-800 bg-dark-950/90 px-4 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-dark-300 transition-colors hover:bg-dark-800 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src={import.meta.env.BASE_URL + 'favicon.png'}
              alt="BetterShape"
              className="h-7 w-7"
            />
            <span className="text-lg font-bold text-primary-500">BetterShape</span>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
