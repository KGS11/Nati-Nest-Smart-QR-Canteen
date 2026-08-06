"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (token: string, user: User, refreshToken?: string | null) => void;
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (token, user, refreshToken = null) =>
        set({ token, refreshToken: null, user, isAuthenticated: true }),
      logout: () => set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "nati-nest-staff-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;

        return {
          ...currentState,
          user: persisted?.user ?? null,
          isAuthenticated: Boolean(persisted?.isAuthenticated && persisted?.user),
          token: null,
          refreshToken: null,
          hasHydrated: false,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
