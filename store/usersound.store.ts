import { getUserSounds, uploadSound } from "@/lib/api";
import type { SystemSound, UserSoundUploadResponse } from "@/lib/schema";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { File, Paths } from "expo-file-system";
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

function cachedFileFor(soundId: number) {
  return new File(Paths.cache, `user-sound-${soundId}.mp3`);
}

// Download once, then always play from disk. Not performant to hit the
// storage server on every preview/alert trigger for a file that never
// changes once uploaded.
async function ensureLocalFile(
  soundId: number,
  publicUrl: string,
): Promise<string> {
  const file = cachedFileFor(soundId);
  if (file.exists) return file.uri;

  const downloaded = await File.downloadFileAsync(publicUrl, file);
  return downloaded.uri;
}

async function evictCachedFile(soundId: number) {
  try {
    const file = cachedFileFor(soundId);
    if (file.exists) file.delete();
  } catch {
    // best-effort — a missing/locked file here isn't worth surfacing
  }
}

type UserSoundState = {
  userSounds: SystemSound[] | null;
  isLoading: boolean;
  error: string | null;

  uploading: boolean;
  uploadError: string | null;

  playingSoundId: number | null;
  loadingSoundId: number | null;
  player: AudioPlayer | null;

  fetchUserSounds: (force?: boolean) => Promise<void>;
  uploadUserSound: (
    name: string,
    asset: { uri: string; name: string; mimeType?: string | null },
  ) => Promise<UserSoundUploadResponse>;

  playPreview: (soundId: number, publicUrl: string) => Promise<void>;
  stopPreview: () => void;

  // Call when a sound is deleted/replaced server-side so its local
  // cache file doesn't linger as an orphan.
  evictSound: (soundId: number) => Promise<void>;

  clearUserSounds: () => void;
  clearError: () => void;
  cleanup: () => void;
};

export const useUserSoundsStore = create<UserSoundState>((set, get) => {
  // Not part of state: we don't want subscription objects triggering
  // re-renders, just want them reachable for cleanup.
  let activeSubscription: { remove: () => void } | null = null;

  const stop = () => {
    const player = get().player;
    disposePlayer(player, activeSubscription ?? undefined);
    activeSubscription = null;

    set({ player: null, playingSoundId: null, loadingSoundId: null });
  };

  return {
    userSounds: null,
    isLoading: false,
    error: null,

    uploading: false,
    uploadError: null,

    playingSoundId: null,
    loadingSoundId: null,
    player: null,

    fetchUserSounds: async (force = false) => {
      const { userSounds, isLoading } = get();

      if (isLoading) return;
      if (userSounds && !force) return;

      set({ isLoading: true, error: null });

      try {
        const data = await getUserSounds();
        set({ userSounds: data, isLoading: false, error: null });
      } catch (err) {
        set({
          isLoading: false,
          error:
            err instanceof Error ? err.message : "Failed to load your sounds",
        });
        throw err;
      }
    },

    uploadUserSound: async (name, asset) => {
      set({ uploading: true, uploadError: null });

      try {
        const result = await uploadSound(name, asset);

        // Show it immediately without waiting on a refetch.
        set((state) => ({
          userSounds: [
            {
              id: result.id,
              name: result.name,
              public_url: result.public_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...(state.userSounds ?? []),
          ],
          uploading: false,
        }));

        return result;
      } catch (err) {
        set({
          uploading: false,
          uploadError:
            err instanceof Error ? err.message : "Failed to upload sound",
        });
        throw err;
      }
    },

    playPreview: async (soundId, publicUrl) => {
      const current = get();

      // Tapping the currently playing OR currently loading (downloading)
      // sound cancels it.
      if (
        current.playingSoundId === soundId ||
        current.loadingSoundId === soundId
      ) {
        stop();
        return;
      }

      const myRequestId = ++requestSeq;

      // Stop anything currently playing/loading before starting a new one.
      stop();
      set({ player: null, playingSoundId: null, loadingSoundId: soundId });

      let localUri: string;
      try {
        localUri = await ensureLocalFile(soundId, publicUrl);
      } catch (error) {
        if (requestSeq === myRequestId) {
          set({ player: null, loadingSoundId: null, playingSoundId: null });
        }
        throw error;
      }

      // A newer playPreview/stop call has taken over while we awaited the
      // download — don't touch state, don't create a player.
      if (requestSeq !== myRequestId) return;

      try {
        const player = createAudioPlayer(localUri);

        set({ player, loadingSoundId: null, playingSoundId: soundId });

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
          set({ player: null, loadingSoundId: null, playingSoundId: null });
        }
        throw error;
      }
    },

    stopPreview: () => {
      stop();
    },

    evictSound: async (soundId) => {
      if (
        get().playingSoundId === soundId ||
        get().loadingSoundId === soundId
      ) {
        stop();
      }
      await evictCachedFile(soundId);
    },

    clearUserSounds: () => {
      stop();
      set({ userSounds: null, error: null, isLoading: false });
    },

    clearError: () => {
      set({ error: null, uploadError: null });
    },

    cleanup: () => {
      stop();
    },
  };
});
