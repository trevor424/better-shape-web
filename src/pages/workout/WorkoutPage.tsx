import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Dumbbell,
  Clock,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  X,
  Play,
  Trophy,
  ListChecks,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

import { Button, Card } from '@/components/ui';
import { useWorkoutStore } from '@/stores/workout-store';
import { exercises } from '@/data/exercises';
import { workoutPlans } from '@/data/workout-plans';
import type { WorkoutExerciseLog, WorkoutSet, WorkoutLog } from '@/types';

// ── Constants ────────────────────────────────────────────────────────────

type Tab = 'history' | 'exercises' | 'plans';

const MUSCLE_GROUPS = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core'] as const;

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: 'bg-red-500/15 text-red-400',
  back: 'bg-blue-500/15 text-blue-400',
  shoulders: 'bg-amber-500/15 text-amber-400',
  arms: 'bg-purple-500/15 text-purple-400',
  legs: 'bg-emerald-500/15 text-emerald-400',
  core: 'bg-cyan-500/15 text-cyan-400',
};

const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;

// ── Helpers ──────────────────────────────────────────────────────────────

function exerciseLookup(id: string) {
  return exercises.find((e) => e.id === id);
}

function buildExerciseLogs(exerciseIds: string[]): WorkoutExerciseLog[] {
  return exerciseIds.map((id) => {
    const ex = exerciseLookup(id);
    return {
      exerciseId: id,
      exerciseName: ex?.name ?? 'Unknown Exercise',
      sets: Array.from({ length: DEFAULT_SETS }, (): WorkoutSet => ({
        reps: DEFAULT_REPS,
        weight: 0,
        completed: false,
      })),
    };
  });
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function totalCompletedSets(workout: WorkoutLog): number {
  return workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export default function WorkoutPage() {
  const {
    workoutHistory,
    activeWorkout,
    startWorkout,
    updateSet,
    completeWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [activeTab, setActiveTab] = useState<Tab>('history');
  const [justCompleted, setJustCompleted] = useState(false);

  // When a workout completes, show success briefly then go to history
  const handleCompleteWorkout = () => {
    completeWorkout();
    setJustCompleted(true);
    setTimeout(() => {
      setJustCompleted(false);
      setActiveTab('history');
    }, 2000);
  };

  const handleCancelWorkout = () => {
    cancelWorkout();
    setActiveTab('history');
  };

  const handleStartDay = (planName: string, dayName: string, exerciseIds: string[]) => {
    const exerciseLogs = buildExerciseLogs(exerciseIds);
    startWorkout({
      planName,
      dayName,
      exercises: exerciseLogs,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────

  // Success splash after completing
  if (justCompleted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-500/20">
          <Trophy className="h-10 w-10 text-primary-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Workout Complete!</h2>
        <p className="text-dark-300">Great job. Your progress has been saved.</p>
      </div>
    );
  }

  // Active workout view
  if (activeWorkout) {
    return (
      <ActiveWorkoutView
        activeWorkout={activeWorkout}
        updateSet={updateSet}
        onComplete={handleCompleteWorkout}
        onCancel={handleCancelWorkout}
      />
    );
  }

  // Tabs view
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Workout</h1>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {([
          { key: 'history' as Tab, label: 'History', icon: ClipboardList },
          { key: 'exercises' as Tab, label: 'Exercises', icon: Dumbbell },
          { key: 'plans' as Tab, label: 'Plans', icon: BookOpen },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors
              ${activeTab === key
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'}
            `}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'history' && <HistoryTab workoutHistory={workoutHistory} />}
      {activeTab === 'exercises' && <ExercisesTab />}
      {activeTab === 'plans' && <PlansTab onStartDay={handleStartDay} />}
    </div>
  );
}

// ── History Tab ──────────────────────────────────────────────────────────

function HistoryTab({ workoutHistory }: { workoutHistory: WorkoutLog[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...workoutHistory].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      ),
    [workoutHistory],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-dark-800">
          <Dumbbell className="h-8 w-8 text-dark-500" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">No workouts yet</p>
          <p className="mt-1 text-sm text-dark-400">
            Start your first workout from the Plans tab!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((workout) => {
        const isExpanded = expandedId === workout.id;
        const completedSets = totalCompletedSets(workout);

        return (
          <Card key={workout.id}>
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={() => setExpandedId(isExpanded ? null : workout.id)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">
                  {workout.planName ?? 'Custom Workout'}
                  {workout.dayName ? ` - ${workout.dayName}` : ''}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dark-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(workout.startedAt), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {workout.durationMinutes} min
                  </span>
                  <span>
                    {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    {completedSets} set{completedSets !== 1 ? 's' : ''} completed
                  </span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-dark-400" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-dark-400" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-3 border-t border-dark-700 pt-4">
                {workout.exercises.map((ex, idx) => (
                  <div key={idx}>
                    <p className="text-sm font-medium text-primary-400">{ex.exerciseName}</p>
                    <div className="mt-1.5 space-y-1">
                      {ex.sets.map((set, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-3 text-xs text-dark-300"
                        >
                          <span className="w-14">Set {sIdx + 1}</span>
                          <span className="w-16">{set.reps} reps</span>
                          <span className="w-16">
                            {set.weight > 0 ? `${set.weight} kg` : '--'}
                          </span>
                          {set.completed && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Exercises Tab ────────────────────────────────────────────────────────

function ExercisesTab() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = exercises;
    if (filter !== 'all') {
      result = result.filter((e) => e.muscleGroup === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [filter, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border-2 border-dark-700 bg-dark-800 pl-11 pr-4 text-sm text-white placeholder:text-dark-400 transition-colors focus:border-primary-400 focus:outline-none"
        />
      </div>

      {/* Muscle Group Filter */}
      <div className="flex flex-wrap gap-2">
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => setFilter(group)}
            className={`
              rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors
              ${filter === group
                ? 'bg-primary-500 text-white'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}
            `}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-dark-400">
          No exercises match your filters.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ex) => {
            const isExpanded = expandedId === ex.id;
            const badgeColor = MUSCLE_GROUP_COLORS[ex.muscleGroup] ?? 'bg-dark-700 text-dark-300';

            return (
              <Card
                key={ex.id}
                onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{ex.name}</h3>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-dark-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-dark-400" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeColor}`}>
                    {ex.muscleGroup}
                  </span>
                  <span className="rounded-md bg-dark-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-dark-300">
                    {ex.equipment}
                  </span>
                  <span className="rounded-md bg-dark-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-dark-300">
                    {ex.type}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-2 border-t border-dark-700 pt-3">
                    <p className="text-xs leading-relaxed text-dark-300">{ex.description}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Plans Tab ────────────────────────────────────────────────────────────

function PlansTab({
  onStartDay,
}: {
  onStartDay: (planName: string, dayName: string, exerciseIds: string[]) => void;
}) {
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {workoutPlans.map((plan) => {
        const isExpanded = expandedPlanId === plan.id;

        return (
          <Card key={plan.id}>
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-dark-400">{plan.description}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="rounded-lg bg-primary-500/15 px-2 py-0.5 text-[11px] font-semibold text-primary-400">
                    {plan.daysPerWeek} days / week
                  </span>
                  <span className="rounded-lg bg-dark-700 px-2 py-0.5 text-[11px] font-semibold capitalize text-dark-300">
                    {plan.type}
                  </span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-dark-400" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-dark-400" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-4 border-t border-dark-700 pt-4">
                {plan.days.map((day, dayIdx) => {
                  const dayExercises = day.exerciseIds
                    .map((id) => exerciseLookup(id))
                    .filter(Boolean);

                  return (
                    <div key={dayIdx} className="rounded-xl bg-dark-800 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-white">{day.name}</h4>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onStartDay(plan.name, day.name, day.exerciseIds)}
                          >
                            <Play className="h-3.5 w-3.5" />
                            Start
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {dayExercises.map((ex) => (
                          <div key={ex!.id} className="flex items-center gap-2 text-xs text-dark-300">
                            <span className="h-1 w-1 rounded-full bg-primary-500" />
                            <span>{ex!.name}</span>
                            <span className="text-dark-500">({ex!.equipment})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Active Workout View ──────────────────────────────────────────────────

function ActiveWorkoutView({
  activeWorkout,
  updateSet,
  onComplete,
  onCancel,
}: {
  activeWorkout: {
    planName?: string;
    dayName?: string;
    exercises: WorkoutExerciseLog[];
    startedAt: string;
  };
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(activeWorkout.startedAt).getTime();
    // Immediately calculate current elapsed time
    setElapsed(Math.floor((Date.now() - start) / 1000));

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout.startedAt]);

  const workoutLabel = [activeWorkout.planName, activeWorkout.dayName]
    .filter(Boolean)
    .join(' - ') || 'Workout';

  const totalSets = activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl bg-primary-500 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{workoutLabel}</h1>
            <div className="mt-1 flex items-center gap-4 text-sm text-primary-100">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {formatElapsed(elapsed)}
              </span>
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" />
                {completedSets} / {totalSets} sets
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25"
            title="Cancel workout"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Exercise Sections */}
      {activeWorkout.exercises.map((exercise, exIdx) => (
        <ExerciseSetEditor
          key={exIdx}
          exercise={exercise}
          exerciseIndex={exIdx}
          updateSet={updateSet}
        />
      ))}

      {/* Action Buttons */}
      <div className="flex gap-3 pb-6">
        <Button variant="primary" size="lg" fullWidth onClick={onComplete}>
          <CheckCircle2 className="h-5 w-5" />
          Complete Workout
        </Button>
      </div>
    </div>
  );
}

// ── Exercise Set Editor ──────────────────────────────────────────────────

function ExerciseSetEditor({
  exercise,
  exerciseIndex,
  updateSet,
}: {
  exercise: WorkoutExerciseLog;
  exerciseIndex: number;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => void;
}) {
  return (
    <Card>
      <h3 className="mb-3 text-base font-semibold text-white">{exercise.exerciseName}</h3>

      {/* Table Header */}
      <div className="mb-2 grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-dark-400">
        <span>Set</span>
        <span>Reps</span>
        <span>Weight (kg)</span>
        <span className="text-center">Done</span>
      </div>

      {/* Set Rows */}
      <div className="space-y-2">
        {exercise.sets.map((set, setIdx) => (
          <div
            key={setIdx}
            className={`grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2 rounded-lg p-1.5 transition-colors ${
              set.completed ? 'bg-primary-500/10' : 'bg-dark-800'
            }`}
          >
            {/* Set Number */}
            <span className="text-center text-sm font-bold text-dark-300">
              {setIdx + 1}
            </span>

            {/* Reps Input */}
            <input
              type="number"
              min={0}
              value={set.reps}
              onChange={(e) =>
                updateSet(exerciseIndex, setIdx, {
                  reps: parseInt(e.target.value, 10) || 0,
                })
              }
              className="h-9 w-full rounded-lg border border-dark-600 bg-dark-900 px-2 text-center text-sm text-white focus:border-primary-400 focus:outline-none"
            />

            {/* Weight Input */}
            <input
              type="number"
              min={0}
              step={0.5}
              value={set.weight}
              onChange={(e) =>
                updateSet(exerciseIndex, setIdx, {
                  weight: parseFloat(e.target.value) || 0,
                })
              }
              className="h-9 w-full rounded-lg border border-dark-600 bg-dark-900 px-2 text-center text-sm text-white focus:border-primary-400 focus:outline-none"
            />

            {/* Completed Checkbox */}
            <div className="flex justify-center">
              <button
                onClick={() =>
                  updateSet(exerciseIndex, setIdx, { completed: !set.completed })
                }
                className={`flex h-7 w-7 items-center justify-center rounded-md border-2 transition-colors ${
                  set.completed
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-dark-500 bg-transparent text-transparent hover:border-dark-400'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
