import { create } from "zustand";
import { getCurrentUser } from "@/lib/api";
import type { UserProfile } from "@/lib/schema";

type UserState = {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  fetchUser: () => Promise<void>;
  clearUser: () => void;
  clearError: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await getCurrentUser();
      set({ user });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to load your profile.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearUser: () => set({ user: null, error: null, isLoading: false }),

  clearError: () => set({ error: null }),
}));
