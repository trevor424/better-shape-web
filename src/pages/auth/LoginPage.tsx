import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserCircle } from 'lucide-react';

import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import { useUserStore } from '@/stores/user-store';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const profile = useUserStore((s) => s.profile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);

    // Simulate network delay for demo mode
    await new Promise((resolve) => setTimeout(resolve, 800));

    setAuthenticated('demo-user', data.email);

    if (profile && profile.onboardingCompleted) {
      navigate('/');
    } else {
      navigate('/onboarding');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-dark-900 p-8 shadow-xl animate-scale-in">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/15">
            <LogIn className="h-7 w-7 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-1 text-sm text-dark-300">
            Sign in to continue your fitness journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-dark-700" />
          <span className="text-xs text-dark-400">or</span>
          <div className="h-px flex-1 bg-dark-700" />
        </div>

        {/* Guest button */}
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => {
            setAuthenticated('guest-user', 'guest@bettershape.app');
            if (profile && profile.onboardingCompleted) {
              navigate('/');
            } else {
              navigate('/onboarding');
            }
          }}
        >
          <UserCircle className="h-5 w-5" />
          Continue as Guest
        </Button>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-dark-300">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-500 transition-colors hover:text-primary-400"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
