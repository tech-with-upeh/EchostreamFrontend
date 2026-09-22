import { getGifts } from "@/lib/api";
import type { GiftsResponse } from "@/lib/schema";
import { create } from "zustand";

type GiftState = {
  gifts: GiftsResponse | null;
  isLoading: boolean;
  error: string | null;

  fetchGifts: (force?: boolean) => Promise<void>;
  setGifts: (gifts: GiftsResponse) => void;
  clearGifts: () => void;
  clearError: () => void;
};

export const useGiftsStore = create<GiftState>((set, get) => ({
  gifts: null,
  isLoading: false,
  error: null,

  fetchGifts: async (force = false) => {
    const { gifts, isLoading } = get();

    if (isLoading) return;
    if (gifts && !force) return;

    set({
      isLoading: true,
      error: null,
    });

    try {
      const data = await getGifts();

      set({
        gifts: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load gifts",
      });

      throw err;
    }
  },

  setGifts: (gifts) => {
    set({
      gifts,
      error: null,
    });
  },

  clearGifts: () => {
    set({
      gifts: null,
      error: null,
      isLoading: false,
    });
  },

  clearError: () => {
    set({
      error: null,
    });
  },
}));
