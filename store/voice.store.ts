import { getVoices } from "@/lib/api";
import type { VoicesResponse } from "@/lib/schema";
import { create } from "zustand";

type VoiceState = {
  voices: VoicesResponse | null;
  isLoading: boolean;
  error: string | null;

  fetchVoices: (force?: boolean) => Promise<void>;
  setVoices: (Voices: VoicesResponse) => void;
  clearVoices: () => void;
  clearError: () => void;
};

export const useVoicesStore = create<VoiceState>((set, get) => ({
  voices: null,
  isLoading: false,
  error: null,

  fetchVoices: async (force = false) => {
    const { voices, isLoading } = get();
    if (isLoading) return;
    if (voices && !force) return; // already have data, don't refetch or reload

    set({ isLoading: true });
    try {
      const data = await getVoices();
      set({ voices: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setVoices: (voices) => {
    set({ voices, error: null });
  },

  clearVoices: () => {
    set({
      voices: null,
      error: null,
      isLoading: false,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
