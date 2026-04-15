import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Role = "teacher" | "student" | "parent";

export interface User {
  id: string;
  name: string;
  role: Role;
  schoolId?: string;
  classId?: string;
  className?: string;
  studentId?: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,

      setUser: (user, token) => {
        set({
          user,
          token,
          role: user?.role || null,
          isAuthenticated: !!token,
        });
      },

      logout: () => {
        set({ user: null, token: null, role: null, isAuthenticated: false });
      },
    }),
    {
      name: "hajeri-auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);