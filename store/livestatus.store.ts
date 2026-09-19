import { getLiveStatus } from "@/lib/api";
import type { LiveStatus } from "@/lib/schema";
import { create } from "zustand";

interface LiveStatusState {
  status: LiveStatus | null;
  isLoading: boolean; // true only for the very first fetch ever
  hasFetchedOnce: boolean;
  fetchLiveStatus: (force?: boolean) => Promise<void>;
}

export const useLiveStatusStore = create<LiveStatusState>((set, get) => ({
  status: null,
  isLoading: false,
  hasFetchedOnce: false,

  fetchLiveStatus: async (force = false) => {
    const { hasFetchedOnce } = get();

    // First-ever fetch: show loading state.
    // Subsequent fetches: keep showing cached `status`, fetch silently.
    if (!hasFetchedOnce || force) {
      set({ isLoading: true });
    }

    try {
      const data = await getLiveStatus();
      set({ status: data, isLoading: false, hasFetchedOnce: true });
    } catch (err) {
      reportError("Failed to load live status: " + err);
      // Keep whatever we already had cached; just stop loading.
      set({ isLoading: false, hasFetchedOnce: true });
    }
  },
}));
