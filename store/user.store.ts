import { getCurrentUser } from "@/lib/api";
import type { UserProfile } from "@/lib/schema";
import { create } from "zustand";

type UserState = {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  fetchUser: (force?: boolean) => Promise<void>;
  clearUser: () => void;
  clearError: () => void;
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchUser: async (force = false) => {
    const { user, isLoading } = get();
    if (isLoading) return;
    if (user && !force) return;
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
