import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { format } from 'date-fns';

import type { MealLogEntry } from '../types/index';

interface DailySummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type { DailySummary };

interface NutritionState {
  dailyLogs: Record<string, MealLogEntry[]>;
  selectedDate: string;

  addMealLog: (entry: MealLogEntry) => void;
  removeMealLog: (date: string, entryId: string) => void;
  setSelectedDate: (date: string) => void;
  getDailySummary: (date: string) => DailySummary;
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      dailyLogs: {},
      selectedDate: format(new Date(), 'yyyy-MM-dd'),

      addMealLog: (entry) =>
        set((state) => {
          const dateKey = entry.date;
          const existing = state.dailyLogs[dateKey] ?? [];
          return {
            dailyLogs: {
              ...state.dailyLogs,
              [dateKey]: [...existing, entry],
            },
          };
        }),

      removeMealLog: (date, entryId) =>
        set((state) => {
          const existing = state.dailyLogs[date];
          if (!existing) return state;
          return {
            dailyLogs: {
              ...state.dailyLogs,
              [date]: existing.filter((e) => e.id !== entryId),
            },
          };
        }),

      setSelectedDate: (date) => set({ selectedDate: date }),

      getDailySummary: (date) => {
        const entries = get().dailyLogs[date] ?? [];
        return entries.reduce<DailySummary>(
          (acc, entry) => ({
            calories: acc.calories + entry.calories,
            protein: acc.protein + entry.protein,
            carbs: acc.carbs + entry.carbs,
            fat: acc.fat + entry.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );
      },
    }),
    {
      name: 'nutrition-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
