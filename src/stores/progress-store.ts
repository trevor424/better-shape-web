import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { WeightEntry } from '../types/index';

interface ProgressState {
  weightEntries: WeightEntry[];

  addWeightEntry: (entry: WeightEntry) => void;
  removeWeightEntry: (id: string) => void;
  getLatestWeight: () => WeightEntry | null;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      weightEntries: [],

      addWeightEntry: (entry) =>
        set((state) => ({
          weightEntries: [...state.weightEntries, entry].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          ),
        })),

      removeWeightEntry: (id) =>
        set((state) => ({
          weightEntries: state.weightEntries.filter((e) => e.id !== id),
        })),

      getLatestWeight: () => {
        const entries = get().weightEntries;
        if (entries.length === 0) return null;
        return entries[entries.length - 1];
      },
    }),
    {
      name: 'progress-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
