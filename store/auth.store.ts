import {
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  register as apiRegister,
  resendVerification as apiResendVerification,
  clearAuthTokens,
  ForgotPassword,
  persistAuthTokens,
  ResetPassword,
  restoreAuthSession,
  verifyEmailCode,
  type RegisterResponse,
  type TokenResponse,
} from "@/lib/api";
import type { AuthResponse } from "@/lib/schema";
import { useUserStore } from "@/store/user.store";
import { create } from "zustand";
import { usePreferencesStore } from "./preference.store";

type AuthState = {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<TokenResponse>;
  loginWithGoogle: (idToken: string) => Promise<TokenResponse>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) => Promise<RegisterResponse>;
  verifyEmail: (
    email: string,
    code: string,
  ) => Promise<TokenResponse & AuthResponse>;
  resendVerification: (email: string) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<AuthResponse>;
  resetPassword: (
    token: string,
    email: string,
    password: string,
  ) => Promise<TokenResponse & AuthResponse>;
  setSession: (tokens: TokenResponse) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isInitialized: false,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const authenticated = await restoreAuthSession();
      set({ isAuthenticated: authenticated, isInitialized: true });
    } catch (error) {
      set({
        isAuthenticated: false,
        isInitialized: true,
        error:
          error instanceof Error ? error.message : "Unable to restore session.",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await apiLogin(email, password);
      await persistAuthTokens(tokens);
      set({ isAuthenticated: true });
      return tokens;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to log in.",
        isAuthenticated: false,
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await apiLoginWithGoogle(idToken);
      await persistAuthTokens(tokens);
      set({ isAuthenticated: true });
      return tokens;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to log in with Google.",
        isAuthenticated: false,
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (firstName, lastName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      return await apiRegister(firstName, lastName, email, password);
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to create your account.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  verifyEmail: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const result = await verifyEmailCode(email, code);
      if (!result.access_token || !result.refresh_token)
        throw new Error(
          "Verification succeeded but the server did not return a session.",
        );
      await persistAuthTokens(result);
      set({ isAuthenticated: true });
      return result;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify your email.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resendVerification: async (email) => {
    set({ isLoading: true, error: null });
    try {
      return await apiResendVerification(email);
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to resend the verification code.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      return await ForgotPassword(email);
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to send the reset code.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (token, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await ResetPassword(token, email, password);
      if (!result.access_token || !result.refresh_token)
        throw new Error("The server returned an invalid login response.");
      await persistAuthTokens(result);
      set({ isAuthenticated: true });
      return result;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to reset your password.",
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setSession: async (tokens) => {
    await persistAuthTokens(tokens);
    set({ isAuthenticated: true, isInitialized: true, error: null });
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiLogout();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Unable to log out.",
      });
    } finally {
      clearAuthTokens();
      useUserStore.getState().clearUser();
      usePreferencesStore.getState().clearPreferences();
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
