import { create } from "zustand";
import {
  clearAuthTokens,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout,
  persistAuthTokens,
  restoreAuthSession,
  type TokenResponse,
} from "@/lib/api";

type AuthState = {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<TokenResponse>;
  loginWithGoogle: (idToken: string) => Promise<TokenResponse>;
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
      set({
        isAuthenticated: authenticated,
        isInitialized: true,
      });
    } catch (error) {
      set({
        isAuthenticated: false,
        isInitialized: true,
        error: error instanceof Error ? error.message : "Unable to restore session.",
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
      const message = error instanceof Error ? error.message : "Unable to log in.";
      set({ error: message, isAuthenticated: false });
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
      const message = error instanceof Error ? error.message : "Unable to log in with Google.";
      set({ error: message, isAuthenticated: false });
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
      set({ error: error instanceof Error ? error.message : "Unable to log out." });
    } finally {
      clearAuthTokens();
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
