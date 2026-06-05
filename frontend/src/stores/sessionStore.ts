"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SessionState {
  sessionToken: string | null;
  sessionId: string | null;
  tableNumber: string | null;
  setSession: (sessionToken: string, sessionId: string, tableNumber: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessionToken: null,
      sessionId: null,
      tableNumber: null,
      setSession: (sessionToken, sessionId, tableNumber) =>
        set({ sessionToken, sessionId, tableNumber }),
      clearSession: () => set({ sessionToken: null, sessionId: null, tableNumber: null }),
    }),
    {
      name: "nati-nest-customer-session",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
