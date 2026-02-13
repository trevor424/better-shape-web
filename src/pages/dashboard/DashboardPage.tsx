import { useNavigate } from 'react-router-dom';
import { format, subDays, isAfter } from 'date-fns';
import {
  UtensilsCrossed,
  Dumbbell,
  Scale,
  Activity,
  Weight,
  Calendar,
  Clock,
  ChevronRight,
} from 'lucide-react';

import { useUserStore } from '@/stores/user-store';
import { useNutritionStore } from '@/stores/nutrition-store';
import { useWorkoutStore } from '@/stores/workout-store';
import { useProgressStore } from '@/stores/progress-store';
import { Card, ProgressRing, MacroBar, Button } from '@/components/ui';

// ── Constants ────────────────────────────────────────────────────────

const DEFAULT_CALORIES = 2000;
const DEFAULT_MACROS = { protein: 150, carbs: 200, fat: 65 };

const BMI_CATEGORY_LABELS: Record<string, string> = {
  underweight: 'Underweight',
  normal: 'Normal',
  overweight: 'Overweight',
  obese: 'Obese',
};

// ── Component ────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();

  // ── Store data ───────────────────────────────────────────────────
  const profile = useUserStore((s) => s.profile);
  const healthMetrics = useUserStore((s) => s.healthMetrics);
  const getDailySummary = useNutritionStore((s) => s.getDailySummary);
  const workoutHistory = useWorkoutStore((s) => s.workoutHistory);
  const getLatestWeight = useProgressStore((s) => s.getLatestWeight);

  // ── Derived values ───────────────────────────────────────────────
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todaySummary = getDailySummary(todayKey);

  const targetCalories = healthMetrics?.targetCalories ?? DEFAULT_CALORIES;
  const macroTargets = healthMetrics?.macros ?? DEFAULT_MACROS;
  const calorieProgress = targetCalories > 0
    ? Math.min(todaySummary.calories / targetCalories, 1)
    : 0;

  const firstName = profile?.displayName?.split(' ')[0] ?? 'User';

  const latestWeight = getLatestWeight();
  const currentWeight = latestWeight?.weightKg ?? profile?.weightKg ?? 0;

  const sevenDaysAgo = subDays(new Date(), 7);
  const workoutsThisWeek = workoutHistory.filter((w) =>
    isAfter(new Date(w.date), sevenDaysAgo),
  ).length;

  const recentWorkouts = [...workoutHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Welcome Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-dark-300">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* ── Top Grid: Calorie Ring + Macros ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calorie Ring Card */}
        <Card className="flex flex-col items-center justify-center gap-4 py-8 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
            Today's Calories
          </h2>

          <ProgressRing
            size={180}
            strokeWidth={12}
            progress={calorieProgress}
            color="var(--color-primary-500)"
          >
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-white">
                {Math.round(todaySummary.calories)}
              </span>
              <span className="text-sm text-dark-300">
                / {targetCalories} kcal
              </span>
            </div>
          </ProgressRing>

          <p className="text-sm text-dark-400">
            {Math.round(targetCalories - todaySummary.calories) > 0
              ? `${Math.round(targetCalories - todaySummary.calories)} kcal remaining`
              : 'Goal reached!'}
          </p>
        </Card>

        {/* Macro Breakdown Card */}
        <Card className="flex flex-col gap-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
            Macro Breakdown
          </h2>

          <div className="flex flex-1 flex-col justify-center gap-5">
            <MacroBar
              label="Protein"
              current={Math.round(todaySummary.protein)}
              target={macroTargets.protein}
              color="#3b82f6"
            />
            <MacroBar
              label="Carbs"
              current={Math.round(todaySummary.carbs)}
              target={macroTargets.carbs}
              color="#f59e0b"
            />
            <MacroBar
              label="Fat"
              current={Math.round(todaySummary.fat)}
              target={macroTargets.fat}
              color="#ef4444"
            />
          </div>
        </Card>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          className="flex flex-col items-center gap-3 py-6"
          onClick={() => navigate('/nutrition')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/15">
            <UtensilsCrossed className="h-6 w-6 text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-white">Log Meal</span>
        </Card>

        <Card
          className="flex flex-col items-center gap-3 py-6"
          onClick={() => navigate('/workout')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/15">
            <Dumbbell className="h-6 w-6 text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-white">Start Workout</span>
        </Card>

        <Card
          className="flex flex-col items-center gap-3 py-6"
          onClick={() => navigate('/progress')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/15">
            <Scale className="h-6 w-6 text-primary-400" />
          </div>
          <span className="text-sm font-semibold text-white">Log Weight</span>
        </Card>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* BMI */}
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-700">
            <Activity className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
              BMI
            </p>
            <p className="text-lg font-bold text-white">
              {healthMetrics ? healthMetrics.bmi.toFixed(1) : '--'}
            </p>
            <p className="text-xs text-dark-300">
              {healthMetrics
                ? BMI_CATEGORY_LABELS[healthMetrics.bmiCategory] ?? healthMetrics.bmiCategory
                : 'Not calculated'}
            </p>
          </div>
        </Card>

        {/* Current Weight */}
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-700">
            <Weight className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
              Weight
            </p>
            <p className="text-lg font-bold text-white">
              {currentWeight > 0 ? `${currentWeight.toFixed(1)} kg` : '--'}
            </p>
            <p className="text-xs text-dark-300">
              {latestWeight
                ? `Updated ${format(new Date(latestWeight.date), 'MMM d')}`
                : 'No entries yet'}
            </p>
          </div>
        </Card>

        {/* Workouts This Week */}
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-700">
            <Dumbbell className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
              This Week
            </p>
            <p className="text-lg font-bold text-white">
              {workoutsThisWeek} workout{workoutsThisWeek !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-dark-300">Last 7 days</p>
          </div>
        </Card>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────── */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-300">
            Recent Activity
          </h2>
          {recentWorkouts.length > 0 && (
            <button
              onClick={() => navigate('/workout')}
              className="flex items-center gap-1 text-xs font-medium text-primary-400 transition-colors hover:text-primary-300"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dark-800">
              <Dumbbell className="h-7 w-7 text-dark-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">No workouts yet</p>
              <p className="mt-1 text-xs text-dark-400">
                Start your first workout!
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/workout')}
            >
              Start Workout
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-dark-800">
            {recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-800">
                  <Dumbbell className="h-5 w-5 text-primary-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {workout.planName ?? 'Custom Workout'}
                    {workout.dayName ? ` - ${workout.dayName}` : ''}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-dark-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(workout.date), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {workout.durationMinutes} min
                    </span>
                    <span>
                      {workout.exercises.length} exercise
                      {workout.exercises.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
