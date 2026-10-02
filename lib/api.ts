import {
  AuthResponse,
  CloneResponse,
  EventAlertConfig,
  GiftsPreference,
  GiftsResponse,
  LiveStatus,
  NotificationPreferenceResponse,
  Preferences,
  RegisterDeviceResponse,
  SystemSound,
  SystemSoundsResponse,
  TTSRequest,
  UserClonedResponse,
  UserProfile,
  UserSoundResponse,
  UserSoundUploadResponse,
  VoicesResponse,
} from "@/lib/schema";
import { reportWarning } from "@/store/error.store";
import * as SecureStore from "expo-secure-store";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
const ACCESS_TOKEN_KEY = "echostream.access_token";
const REFRESH_TOKEN_KEY = "echostream.refresh_token";

if (!BACKEND_URL)
  reportWarning(
    "EXPO_PUBLIC_BACKEND_URL is not configured. Add it to your .env file.",
  );

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
};
export type RegisterResponse = Record<string, unknown>;

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<TokenResponse> | null = null;

export function setAuthTokens(tokens: TokenResponse) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  void Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access_token),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token),
  ]);
}

export async function persistAuthTokens(tokens: TokenResponse) {
  setAuthTokens(tokens);
}

export async function restoreAuthSession(): Promise<boolean> {
  try {
    const [storedAccess, storedRefresh] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);
    if (!storedRefresh) return false;

    if (storedAccess)
      setAuthTokens({
        access_token: storedAccess,
        refresh_token: storedRefresh,
      });

    if (storedAccess) {
      try {
        await request("/users/me");
        return true;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;
      }
    }

    try {
      const tokens = await refreshSession(storedRefresh);
      await persistAuthTokens(tokens);
      return true;
    } catch {
      await clearPersistedAuthTokens();
      return false;
    }
  } catch {
    await clearPersistedAuthTokens();
    return false;
  }
}

export function getAccessToken() {
  return accessToken;
}
export function getRefreshToken() {
  return refreshToken;
}

export async function clearPersistedAuthTokens() {
  accessToken = null;
  refreshToken = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export function clearAuthTokens() {
  void clearPersistedAuthTokens();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function rawRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  responseType: "json" | "arrayBuffer" = "json",
): Promise<T> {
  if (!BACKEND_URL) {
    throw new ApiError("Backend URL is not configured.", 0);
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  let response: Response;

  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: {
        Accept:
          responseType === "arrayBuffer" ? "audio/mpeg" : "application/json",
        // Don't set Content-Type for multipart bodies — fetch computes
        // the correct multipart boundary itself. Setting it manually
        // (even to "multipart/form-data") strips the boundary and the
        // server can't parse the parts.
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach EchoStream. Check your internet connection.",
      0,
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    const body = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: unknown }).detail)
        : typeof body === "string" && body
          ? body
          : "Something went wrong. Please try again.";

    throw new ApiError(detail, response.status);
  }

  if (responseType === "arrayBuffer") {
    return (await response.arrayBuffer()) as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  const body = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  return body as T;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  responseType: "json" | "arrayBuffer" = "json",
): Promise<T> {
  try {
    return await rawRequest<T>(path, options, accessToken, responseType);
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      !refreshToken ||
      path === "/refresh" ||
      path === "/login"
    ) {
      throw error;
    }

    if (!refreshPromise) {
      refreshPromise = refreshSession(refreshToken).finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const tokens = await refreshPromise;

      await persistAuthTokens(tokens);

      return await rawRequest<T>(path, options, accessToken, responseType);
    } catch (refreshError) {
      await clearPersistedAuthTokens();
      throw refreshError;
    }
  }
}

export function login(email: string, password: string) {
  return request<TokenResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginWithGoogle(idToken: string) {
  return rawRequest<TokenResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

export function register(
  first_name: string,
  last_name: string,
  email: string,
  password: string,
) {
  return request<RegisterResponse>("/register", {
    method: "POST",
    body: JSON.stringify({ first_name, last_name, email, password }),
  });
}

export function verifyEmailCode(email: string, code: string) {
  return request<TokenResponse & AuthResponse>("/verify-email-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function resendVerification(email: string) {
  return request<AuthResponse>("/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function ForgotPassword(email: string) {
  return request<AuthResponse>("/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function ResetPassword(token: string, email: string, passwd: string) {
  return request<TokenResponse & AuthResponse>("/reset-pass-code", {
    method: "POST",
    body: JSON.stringify({ token: token, email: email, password: passwd }),
  });
}

export function refreshSession(token: string) {
  return rawRequest<TokenResponse>(
    "/refresh",
    { method: "POST", body: JSON.stringify({ refresh_token: token }) },
    null,
  );
}

export function logout() {
  return request<AuthResponse>("/logout", { method: "POST" });
}

//LIVE

export function getLiveStatus() {
  return request<LiveStatus>("/v1/live/status");
}

//PREFRENCES
export function getPreferences() {
  return request<Preferences>("/v1/preferences");
}

export function updatePreferences(preferences: Preferences) {
  return request<Preferences>("/v1/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

// DASHBOARD

export function getCurrentUser() {
  return request<UserProfile>("/users/me");
}

//TTS--- CHAT
export function getVoices() {
  return request<VoicesResponse>("/v1/tts/voices");
}

export function generateTTS(payload: TTSRequest): Promise<ArrayBuffer> {
  return request<ArrayBuffer>(
    "/v1/tts",
    {
      method: "POST",
      headers: { Accept: "audio/mpeg" },
      body: JSON.stringify(payload),
    },
    "arrayBuffer",
  );
}

//TTS --- GIFT
export function getGifts() {
  return request<GiftsResponse>("/v1/gifts");
}

export function getGiftsPreference() {
  return request<GiftsPreference>("/v1/gift-preferences");
}

export function putGiftsPreference(
  preferences: Partial<EventAlertConfig>,
  id: string,
) {
  return request<EventAlertConfig>(`/v1/gift-preferences/${id}`, {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

export function deleteGiftsPreference(id: string) {
  return request<void>(`/v1/gift-preferences/${id}`, {
    method: "DELETE",
  });
}

// Admin Sound Alert
export function getSystemSounds() {
  return request<SystemSoundsResponse>("/v1/system-sounds");
}

//User Sound Alerts
export function getUserSounds() {
  return request<UserSoundResponse>("/v1/sounds");
}

export function getUserSound(soundId: string) {
  return request<SystemSound>(`/v1/sounds/${soundId}`);
}

export function uploadSound(
  name: string,
  asset: { uri: string; name: string; mimeType?: string | null },
) {
  const formData = new FormData();
  formData.append("name", name);
  // React Native's fetch/FormData polyfill accepts this shape for file
  // parts: { uri, name, type }.
  formData.append("file", {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || "audio/mpeg",
  } as unknown as Blob);

  return request<UserSoundUploadResponse>("/v1/gift-alerts/custom-audio", {
    method: "POST",
    body: formData,
  });
}

//Voice Cloning
export function uploadVoiceSample(
  title: string,
  asset: { uri: string; name: string; mimeType?: string | null },
  options: {
    description?: string;
    tags?: string;
    referenceText?: string;
    enhanceAudioQuality?: boolean;
    generateSample?: boolean;
  } = {},
) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append(
    "description",
    options.description ?? `Voice clone for ${title}`,
  );
  formData.append("tags", options.tags ?? "");
  formData.append("reference_text", options.referenceText ?? "");
  formData.append(
    "enhance_audio_quality",
    String(options.enhanceAudioQuality ?? true),
  );
  formData.append("generate_sample", String(options.generateSample ?? false));
  formData.append("audio", {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || "audio/mp4",
  } as unknown as Blob);

  return request<CloneResponse>("/v1/tts/fish/clone", {
    method: "POST",
    body: formData,
  });
}

export function getClonedVoice() {
  return request<UserClonedResponse>("/v1/tts/fish/voices");
}

//Notificatioins

export function registerPushDevice(
  pushToken: string,
  platform: "ios" | "android",
  appVersion?: string | null,
) {
  return request<RegisterDeviceResponse>("/notifications/devices", {
    method: "POST",
    body: JSON.stringify({
      push_token: pushToken,
      platform,
      app_version: appVersion ?? null,
    }),
  });
}

export function getNotifPrefrence() {
  return request<NotificationPreferenceResponse>("/notifications/preferences");
}

export function putNotifPreference(
  preferences: Partial<NotificationPreferenceResponse>,
) {
  return request<NotificationPreferenceResponse>("/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}
