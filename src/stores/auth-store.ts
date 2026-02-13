import { create } from 'zustand';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type { AuthStatus };

interface AuthState {
  status: AuthStatus;
  uid: string | null;
  email: string | null;
  setAuthenticated: (uid: string, email: string) => void;
  setUnauthenticated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unauthenticated',
  uid: null,
  email: null,

  setAuthenticated: (uid, email) =>
    set({ status: 'authenticated', uid, email }),

  setUnauthenticated: () =>
    set({ status: 'unauthenticated', uid: null, email: null }),
}));
