import * as FileSystem from "expo-file-system/legacy";
import { generateTTS } from "./api";

const PREVIEW_TEXT =
  "Hey there! Welcome to EchoStream. I'm here to bring your words to life with a voice that sounds natural, clear, and expressive.";

const CACHE_DIR = `${FileSystem.cacheDirectory}voice-previews/`;

const inFlightRequests = new Map<string, Promise<string>>();

async function ensureCacheDirectory() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, {
      intermediates: true,
    });
  }
}

function getCachePath(voiceId: string, provider: "edge" | "fish") {
  return `${CACHE_DIR}${voiceId}-${provider}.mp3`;
}

async function fileExists(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  return info.exists;
}

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);

    binary += String.fromCharCode(...chunk);
  }

  return globalThis.btoa(binary);
}

async function downloadAndCachePreview(
  voiceId: string,
  provider: "edge" | "fish" = "edge",
): Promise<string> {
  await ensureCacheDirectory();

  const cachePath = getCachePath(voiceId, provider);

  if (await fileExists(cachePath)) {
    return cachePath;
  }

  const audio = await generateTTS({
    text: PREVIEW_TEXT,
    voice: voiceId,
    provider,
    fish_model: "s2.1-pro-free",
    speed: 1.0,
  });

  const base64 = await arrayBufferToBase64(audio);

  await FileSystem.writeAsStringAsync(cachePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return cachePath;
}

export async function getVoicePreview(
  voiceId: string,
  provider: "edge" | "fish" = "edge",
): Promise<string> {
  const cachePath = getCachePath(voiceId, provider);

  // Already cached.
  if (await fileExists(cachePath)) {
    return cachePath;
  }

  // Already being downloaded.
  const existingRequest = inFlightRequests.get(voiceId);

  if (existingRequest) {
    return existingRequest;
  }

  const request = downloadAndCachePreview(voiceId, provider);

  inFlightRequests.set(voiceId, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(voiceId);
  }
}

export async function clearVoicePreviewCache() {
  await FileSystem.deleteAsync(CACHE_DIR, {
    idempotent: true,
  });
}
