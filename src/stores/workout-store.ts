import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { WorkoutExerciseLog, WorkoutLog, WorkoutSet } from '../types/index';

interface ActiveWorkout {
  planName?: string;
  dayName?: string;
  exercises: WorkoutExerciseLog[];
  startedAt: string;
  currentExerciseIndex: number;
}

export type { ActiveWorkout };

interface WorkoutState {
  workoutHistory: WorkoutLog[];
  activeWorkout: ActiveWorkout | null;

  startWorkout: (params: {
    planName?: string;
    dayName?: string;
    exercises: WorkoutExerciseLog[];
  }) => void;
  addSet: (exerciseIndex: number, set: WorkoutSet) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<WorkoutSet>,
  ) => void;
  completeWorkout: () => void;
  cancelWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workoutHistory: [],
      activeWorkout: null,

      startWorkout: ({ planName, dayName, exercises }) =>
        set({
          activeWorkout: {
            planName,
            dayName,
            exercises,
            startedAt: new Date().toISOString(),
            currentExerciseIndex: 0,
          },
        }),

      addSet: (exerciseIndex, newSet) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const exercises = [...state.activeWorkout.exercises];
          const exercise = { ...exercises[exerciseIndex] };
          exercise.sets = [...exercise.sets, newSet];
          exercises[exerciseIndex] = exercise;
          return {
            activeWorkout: { ...state.activeWorkout, exercises },
          };
        }),

      updateSet: (exerciseIndex, setIndex, updates) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const exercises = [...state.activeWorkout.exercises];
          const exercise = { ...exercises[exerciseIndex] };
          const sets = [...exercise.sets];
          sets[setIndex] = { ...sets[setIndex], ...updates };
          exercise.sets = sets;
          exercises[exerciseIndex] = exercise;
          return {
            activeWorkout: { ...state.activeWorkout, exercises },
          };
        }),

      completeWorkout: () => {
        const { activeWorkout, workoutHistory } = get();
        if (!activeWorkout) return;

        const now = new Date().toISOString();
        const startedAt = new Date(activeWorkout.startedAt);
        const completedAt = new Date(now);
        const durationMinutes = Math.round(
          (completedAt.getTime() - startedAt.getTime()) / 60_000,
        );

        const log: WorkoutLog = {
          id: crypto.randomUUID(),
          date: activeWorkout.startedAt.split('T')[0],
          planName: activeWorkout.planName,
          dayName: activeWorkout.dayName,
          exercises: activeWorkout.exercises,
          durationMinutes,
          startedAt: activeWorkout.startedAt,
          completedAt: now,
        };

        set({
          workoutHistory: [...workoutHistory, log],
          activeWorkout: null,
        });
      },

      cancelWorkout: () => set({ activeWorkout: null }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
