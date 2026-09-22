export interface AuthResponse {
  status: string;
  message: string;
}

//LIVE
export interface LiveStatus {
  status: "stopped" | "started" | "failed" | "running" | string;
  username: string | "";
  error: string | null;
}

// PREFERENCES

export type TtsProvider = "edge" | "fish" | string;

export type AlertType = "tts" | "sound" | "custom_audio" | string;

export type AllowedUserType =
  | "all"
  | "subscriber"
  | "moderator"
  | "moderator_and_up";

export interface EventAlertConfig {
  enabled: boolean;
  alert_type: AlertType;
  tts_template: string;
  tts_provider: TtsProvider;
  voice: string | null;
  fish_voice_id: string | null;
  fish_model: string | null;
  system_sound_id: string | null;
  custom_audio_id: string | null;
  custom_audio_url: string | null;
  volume: number | null;
  speed: number | null;
  pitch: string | null;

  id: string;
  event_type: "follow" | "like" | "gift";
  gift_id: string | null;
}

export interface PreferenceEvents {
  gift?: EventAlertConfig;
  like?: EventAlertConfig;
  follow?: EventAlertConfig;
  [eventKey: string]: EventAlertConfig | undefined;
}

export interface Preferences {
  tiktok_username?: string | null;
  tts_provider?: TtsProvider;
  voice?: string;
  fish_voice_id?: string | null;
  fish_model?: string;
  pitch?: string;
  volume?: number;
  speed?: number;
  emoji_to_words?: boolean;
  filter_profanity?: boolean;
  require_command_prefix?: boolean;
  max_message_length?: number;
  comment_speech_enabled?: boolean;
  comment_speech_template?: string;
  events?: PreferenceEvents;
  allowed_user_types?: AllowedUserType[];
  minimum_account_age_days?: number;
  blocked_words?: string[];
  spam_protection_enabled?: boolean;
  block_repeated_words?: boolean;
  auto_mute_repeat_offenders?: boolean;
  spam_cooldown_seconds?: number;
  spam_max_requests_per_minute?: number;
}

//DASHBOARD

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_verified: boolean;
  plan: "starter" | "essential" | "pro";
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
}

//VOICES
export interface EdgeVoice {
  id: string;
  name: string;
  short_name: string;
  gender: "Male" | "Female";
  locale: string;
}

export interface VoicesResponse {
  edge: EdgeVoice[];
  fish: unknown[];
}

export interface TTSRequest {
  text: string;
  provider?: "edge" | "fish";
  voice?: string;
  speed?: number;
  fish_model?: "s2-pro" | "s2.1-pro-free";
}

// TTS--- GIFT
export interface Gift {
  id: string;
  name: string;
  diamond_count: number;
  type: number;
  image_url: string;
}

export type GiftsResponse = Gift[];

export type GiftsPreference = EventAlertConfig[];
