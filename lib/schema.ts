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

//PREFRENCES
export interface Prefrence {
  tiktok_username: string | null;
  tts_provider: "edge" | "fish" | string; // extensible if you use more providers
  voice: string;
  fish_voice_id: string | null;
  fish_model: string;
  pitch: string;
  volume: number;
  speed: number;
  emoji_to_words: boolean;
  filter_profanity: boolean;
  require_command_prefix: boolean;
  max_message_length: number;
  comment_speech_enabled: boolean;
  comment_speech_template: string;
  events: Record<string, any>;
  allowed_user_types: (
    | "all"
    | "subscriber"
    | "moderator"
    | "moderator_and_up"
  )[];
  minimum_account_age_days: number;
  blocked_words: string[];
  spam_protection_enabled: boolean;
  block_repeated_words: boolean;
  auto_mute_repeat_offenders: boolean;
  spam_cooldown_seconds: number;
  spam_max_requests_per_minute: number;
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

export interface EdgeVoice {
  name: string;
  short_name: string;
  gender: "Male" | "Female";
  locale: string;
}

export interface VoicesResponse {
  edge: EdgeVoice[];
  fish: unknown[]; // narrow this once you share a sample
}
