import { create } from "zustand";

export type ErrorSeverity = "error" | "warning" | "info";

export interface AppError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  createdAt: number;
}

interface ErrorState {
  errors: AppError[];
  report: (message: string, severity?: ErrorSeverity) => void;
  dismiss: (id: string) => void;
}

let counter = 0;
let lastMessage = "";
let lastReportedAt = 0;

/** Convert values thrown by APIs, promises, and console calls into safe UI copy. */
export function getErrorMessage(
  value: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value;

  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],

  report: (message, severity = "error") => {
    const now = Date.now();
    // A store action and its caller can legitimately report the same failure.
    // Keep that from producing a stack of identical banners.
    if (message === lastMessage && now - lastReportedAt < 1_000) return;
    lastMessage = message;
    lastReportedAt = now;

    const id = `${Date.now()}-${counter++}`;
    set((state) => ({
      errors: [
        ...state.errors,
        { id, message, severity, createdAt: Date.now() },
      ],
    }));

    // auto-dismiss after a few seconds
    setTimeout(
      () => {
        set((state) => ({
          errors: state.errors.filter((e) => e.id !== id),
        }));
      },
      severity === "error" ? 4500 : 3000,
    );
  },

  dismiss: (id) =>
    set((state) => ({ errors: state.errors.filter((e) => e.id !== id) })),
}));

// Convenience helpers for caught values as well as deliberate messages.
export const reportError = (error: unknown, fallback?: string) =>
  useErrorStore.getState().report(getErrorMessage(error, fallback), "error");

export const reportWarning = (warning: unknown, fallback?: string) =>
  useErrorStore
    .getState()
    .report(getErrorMessage(warning, fallback), "warning");

export const reportInfo = (info: unknown, fallback?: string) =>
  useErrorStore.getState().report(getErrorMessage(info, fallback), "info");

let consoleReportingInstalled = false;

/**
 * Routes future application console calls through the in-app banner instead of
 * the native console/LogBox. Install this once as the app starts.
 */
export function installConsoleReporter() {
  if (consoleReportingInstalled) return;
  consoleReportingInstalled = true;

  const formatArgs = (args: unknown[]) =>
    args
      .map((arg) => getErrorMessage(arg, String(arg ?? "")))
      .filter(Boolean)
      .join(" ");

  console.log = (...args: unknown[]) =>
    reportInfo(formatArgs(args) || "Log message");
  console.warn = (...args: unknown[]) =>
    reportWarning(formatArgs(args) || "Warning");
  console.error = (...args: unknown[]) =>
    reportError(formatArgs(args) || "Error");
}
