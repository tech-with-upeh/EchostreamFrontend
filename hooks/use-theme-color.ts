import { PALETTE, Theme } from '@/constants/theme';
import { useColorScheme } from './use-color-scheme';

export function useAppTheme(): { theme: Theme; isDark: boolean } {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    theme: isDark ? PALETTE.dark : PALETTE.light,
    isDark,
  };
}