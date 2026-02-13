import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { HealthMetrics, UserProfile } from '../types/index';

interface UserState {
  profile: UserProfile | null;
  healthMetrics: HealthMetrics | null;
  onboardingData: Partial<UserProfile>;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setHealthMetrics: (metrics: HealthMetrics) => void;
  updateOnboardingData: (data: Partial<UserProfile>) => void;
  clearOnboardingData: () => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      healthMetrics: null,
      onboardingData: {},

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() }
            : null,
        })),

      setHealthMetrics: (metrics) => set({ healthMetrics: metrics }),

      updateOnboardingData: (data) =>
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        })),

      clearOnboardingData: () => set({ onboardingData: {} }),

      clearUser: () =>
        set({ profile: null, healthMetrics: null, onboardingData: {} }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
