export type GradientTuple = readonly [string, string, ...string[]];

export interface Theme {
  background: string;
  bgGradient: GradientTuple;
  topGlow: string;
  bottomGlow: string;
  onSurface: string;
  onSurfaceVariant: string;
  primary: string;
  primaryDim: string;
  buttonText: string;
  robotShell: string;
  robotBorder: string;
  robotVisor: string;

  // --- New additions (auth screens / cards / inputs) ---
  // Card / bottom-sheet background, sits on top of `background`.
  surface: string;
  // Fill for tab switchers, input backgrounds, chips.
  surfaceVariant: string;
  // Hairline border color for inputs, dividers, outline buttons.
  outline: string;
}

export type ColorScheme = 'light' | 'dark';

export const PALETTE: Record<ColorScheme, Theme> = {
  dark: {
    background: '#131317',
    bgGradient: ['#131317', '#0e0e12', '#050508'],
    topGlow: 'rgba(0, 238, 252, 0.16)',
    bottomGlow: 'rgba(0, 238, 252, 0.08)',
    onSurface: '#E5E1E7',
    onSurfaceVariant: '#D4C0D7',
    primary: '#00EEFC', // Glacier Cyan / Teal-Green
    primaryDim: '#00B4D8',
    buttonText: '#002022',
    robotShell: '#1B1B1F',
    robotBorder: '#353439',
    robotVisor: '#0E0E12',

    surface: '#1A1A1F',
    surfaceVariant: 'rgba(255, 255, 255, 0.06)',
    outline: 'rgba(255, 255, 255, 0.12)',
  },
  light: {
    background: '#F6FAFA',
    bgGradient: ['#FFFFFF', '#EEF8F8', '#E2F2F4'],
    topGlow: 'rgba(0, 190, 210, 0.15)',
    bottomGlow: 'rgba(0, 131, 143, 0.10)',
    onSurface: '#192021',
    onSurfaceVariant: '#546264',
    primary: '#00838F',
    primaryDim: '#00686F',
    buttonText: '#FFFFFF',
    robotShell: '#FFFFFF',
    robotBorder: '#CEDEE0',
    robotVisor: '#192021',

    surface: '#FFFFFF',
    surfaceVariant: 'rgba(0, 0, 0, 0.04)',
    outline: 'rgba(0, 0, 0, 0.10)',
  },
};