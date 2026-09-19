import { getVoicePreview } from "@/lib/voice";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { create } from "zustand";

interface VoicePreviewState {
  playingVoiceId: string | null;
  loadingVoiceId: string | null;

  player: AudioPlayer | null;

  playPreview: (voiceId: string, voice: string) => Promise<void>;
  stopPreview: () => void;
  cleanup: () => void;
}

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

export const useVoicePreviewStore = create<VoicePreviewState>((set, get) => {
  // Not part of state: we don't want subscription objects triggering
  // re-renders, just want them reachable for cleanup.
  let activeSubscription: { remove: () => void } | null = null;

  const stop = () => {
    const player = get().player;
    disposePlayer(player, activeSubscription ?? undefined);
    activeSubscription = null;

    set({
      player: null,
      playingVoiceId: null,
      loadingVoiceId: null,
    });
  };

  return {
    playingVoiceId: null,
    loadingVoiceId: null,
    player: null,

    playPreview: async (voiceId, provider) => {
      const current = get();

      // Tapping the currently playing OR currently loading voice cancels it.
      if (
        current.playingVoiceId === voiceId ||
        current.loadingVoiceId === voiceId
      ) {
        stop();
        return;
      }

      const myRequestId = ++requestSeq;

      // Stop anything currently playing/loading before starting a new one.
      stop();

      set({
        player: null,
        playingVoiceId: null,
        loadingVoiceId: voiceId,
      });

      let audioPath: string;
      try {
        audioPath = await getVoicePreview(voiceId, (provider = "edge"));
      } catch (error) {
        // Only clear loading state if we're still the active request.
        if (requestSeq === myRequestId) {
          set({ player: null, loadingVoiceId: null, playingVoiceId: null });
        }
        throw error;
      }

      // A newer playPreview/stop call has taken over while we awaited —
      // don't touch state, and don't even create a player.
      if (requestSeq !== myRequestId) {
        return;
      }

      try {
        const player = createAudioPlayer(audioPath);

        set({
          player,
          loadingVoiceId: null,
          playingVoiceId: voiceId,
        });

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
                player: state.playingVoiceId === voiceId ? null : state.player,
                playingVoiceId:
                  state.playingVoiceId === voiceId
                    ? null
                    : state.playingVoiceId,
              }));
            }
          },
        );

        activeSubscription = subscription;
      } catch (error) {
        if (requestSeq === myRequestId) {
          set({ player: null, loadingVoiceId: null, playingVoiceId: null });
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
