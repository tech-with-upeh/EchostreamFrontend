import { getPreferences } from "@/lib/api";
import type { Preferences } from "@/lib/schema";
import { create } from "zustand";

type PreferencesState = {
  preferences: Preferences | null;
  isLoading: boolean;
  error: string | null;

  fetchPreferences: (force?: boolean) => Promise<void>;
  setPreferences: (preferences: Preferences) => void;
  clearPreferences: () => void;
  clearError: () => void;
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: null,
  isLoading: false,
  error: null,

  fetchPreferences: async (force = false) => {
    const { preferences, isLoading } = get();
    if (isLoading) return;
    if (preferences && !force) return;
    set({ isLoading: true, error: null });

    try {
      const preferences = await getPreferences();
      set({ preferences });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to load your preferences.",
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setPreferences: (preferences) => {
    set({ preferences, error: null });
  },

  clearPreferences: () => {
    set({
      preferences: null,
      error: null,
      isLoading: false,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
