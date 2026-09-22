import {
    deleteGiftsPreference,
    getGiftsPreference,
    putGiftsPreference,
} from "@/lib/api";
import type { EventAlertConfig, GiftsPreference } from "@/lib/schema";
import { create } from "zustand";

type Giftpref = {
  giftspref: GiftsPreference | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchGiftspref: (force?: boolean) => Promise<void>;
  // A single gift alert's config (EventAlertConfig), not the
  // GiftsPreference array type — the PUT endpoint saves one gift's
  // config at a time, keyed by :id.
  putGiftspref: (
    preferences: Partial<EventAlertConfig>,
    id: string,
  ) => Promise<void>;
  // Removes a gift's alert entirely — used when a gift alert is
  // switched off, rather than PUTting { enabled: false }.
  deleteGiftspref: (id: string) => Promise<void>;
  setGiftspref: (gifts: GiftsPreference) => void;
  clearGiftspref: () => void;
  clearError: () => void;
};

// Serializes PUTs/DELETEs so rapid taps (adding/removing several
// gifts back to back) can't race each other or the refetch that
// follows each one.
let saveChain: Promise<void> = Promise.resolve();

export const useGiftPreferencesStore = create<Giftpref>((set, get) => ({
  giftspref: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchGiftspref: async (force = false) => {
    const { giftspref, isLoading } = get();

    if (isLoading) return;
    if (giftspref && !force) return;

    set({
      isLoading: true,
      error: null,
    });

    try {
      const data = await getGiftsPreference();

      set({
        giftspref: data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to load gift preferences",
      });

      throw err;
    }
  },

  putGiftspref: async (preferences: Partial<EventAlertConfig>, id: string) => {
    set({ isSaving: true, error: null });

    const run = saveChain.then(async () => {
      await putGiftsPreference(preferences, id);

      // Refetch the authoritative list from the server so the
      // new/updated gift shows up merged in alongside every other
      // saved preference, instead of us guessing what got persisted
      // and patching local state ourselves.
      await get().fetchGiftspref(true);
    });

    // Chain onward even on failure, so one bad request doesn't wedge
    // the queue for whatever gets saved next.
    saveChain = run.catch(() => {});

    try {
      await run;
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to save gift preference",
      });

      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  deleteGiftspref: async (id: string) => {
    set({ isSaving: true, error: null });

    const run = saveChain.then(async () => {
      await deleteGiftsPreference(id);

      // Same reasoning as putGiftspref: refetch rather than guess at
      // what's left server-side.
      await get().fetchGiftspref(true);
    });

    saveChain = run.catch(() => {});

    try {
      await run;
    } catch (err) {
      set({
        error:
          err instanceof Error
            ? err.message
            : "Failed to delete gift preference",
      });

      throw err;
    } finally {
      set({ isSaving: false });
    }
  },

  setGiftspref: (gifts) => {
    set({
      giftspref: gifts,
      error: null,
    });
  },

  clearGiftspref: () => {
    set({
      giftspref: null,
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
