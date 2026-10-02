import { getSystemSounds } from "@/lib/api";
import type { SystemSoundsResponse } from "@/lib/schema";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { create } from "zustand";

// Bumped on every playPreview call; lets a resolved-but-stale call detect
// that a newer call has since taken over, so it can dispose its own
// player instead of clobbering/racing with the active one.
let requestSeq = 0;

function disposePlayer(
  player: AudioPlayer | null,
  subscription?: { remove: () => void },
) {
  if (!player) return;
  try {
    subscription?.remove();
  } catch {
    // listener may already be gone — safe to ignore
  }
  try {
    player.pause();
    player.remove();
  } catch {
    // player may already be disposed — safe to ignore
  }
}

type SystemSoundState = {
  systemSounds: SystemSoundsResponse | null;
  isLoading: boolean;
  error: string | null;

  playingSoundId: number | null;
  player: AudioPlayer | null;

  fetchSystemSounds: (force?: boolean) => Promise<void>;
  setSystemSounds: (systemSounds: SystemSoundsResponse) => void;
  clearSystemSounds: () => void;
  clearError: () => void;

  playPreview: (soundId: number, publicUrl: string) => void;
  stopPreview: () => void;
  cleanup: () => void;
};

export const useSystemSoundsStore = create<SystemSoundState>((set, get) => {
  // Not part of state: we don't want subscription objects triggering
  // re-renders, just want them reachable for cleanup.
  let activeSubscription: { remove: () => void } | null = null;

  const stop = () => {
    const player = get().player;
    disposePlayer(player, activeSubscription ?? undefined);
    activeSubscription = null;

    set({ player: null, playingSoundId: null });
  };

  return {
    systemSounds: null,
    isLoading: false,
    error: null,

    playingSoundId: null,
    player: null,

    fetchSystemSounds: async (force = false) => {
      const { systemSounds, isLoading } = get();

      if (isLoading) return;
      if (systemSounds && !force) return;

      set({
        isLoading: true,
        error: null,
      });

      try {
        const data = await getSystemSounds();

        set({
          systemSounds: data,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        set({
          isLoading: false,
          error:
            err instanceof Error ? err.message : "Failed to load system sounds",
        });

        throw err;
      }
    },

    setSystemSounds: (systemSounds) => {
      set({
        systemSounds,
        error: null,
      });
    },

    clearSystemSounds: () => {
      stop();
      set({
        systemSounds: null,
        error: null,
        isLoading: false,
      });
    },

    clearError: () => {
      set({
        error: null,
      });
    },

    playPreview: (soundId, publicUrl) => {
      const current = get();

      // Tapping the currently playing sound cancels it.
      if (current.playingSoundId === soundId) {
        stop();
        return;
      }

      const myRequestId = ++requestSeq;

      // Stop anything currently playing before starting a new one.
      stop();

      try {
        const player = createAudioPlayer(publicUrl);

        // A newer playPreview/stop call has taken over synchronously
        // (shouldn't happen here since createAudioPlayer isn't async, but
        // keep the guard for consistency with the voice-preview store).
        if (requestSeq !== myRequestId) {
          disposePlayer(player);
          return;
        }

        set({ player, playingSoundId: soundId });

        player.play();

        const subscription = player.addListener(
          "playbackStatusUpdate",
          (status) => {
            if (status.didJustFinish) {
              subscription.remove();
              if (activeSubscription === subscription) {
                activeSubscription = null;
              }
              player.remove();

              set((state) => ({
                player: state.playingSoundId === soundId ? null : state.player,
                playingSoundId:
                  state.playingSoundId === soundId
                    ? null
                    : state.playingSoundId,
              }));
            }
          },
        );

        activeSubscription = subscription;
      } catch (error) {
        if (requestSeq === myRequestId) {
          set({ player: null, playingSoundId: null });
        }
        throw error;
      }
    },

    stopPreview: () => {
      stop();
    },

    cleanup: () => {
      stop();
    },
  };
});
