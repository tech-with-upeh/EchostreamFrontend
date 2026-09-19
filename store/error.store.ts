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

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],

  report: (message, severity = "error") => {
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

// Convenience helper so call sites read like console.error
export const reportError = (message: string) =>
  useErrorStore.getState().report(message, "error");

export const reportWarning = (message: string) =>
  useErrorStore.getState().report(message, "warning");

export const reportInfo = (message: string) =>
  useErrorStore.getState().report(message, "info");
