import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-primary-500">
          BetterShape
        </h1>

        {/* Card */}
        <div className="rounded-2xl bg-dark-900 p-8 shadow-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
