import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import { storage } from '../lib/storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  systemColorScheme: ColorSchemeName;
}

interface ThemeActions {
  setMode: (mode: ThemeMode) => Promise<void>;
  initialize: () => Promise<void>;
}

type ThemeStore = ThemeState & ThemeActions;

const THEME_STORAGE_KEY = 'theme-mode';

function resolveIsDark(mode: ThemeMode, systemScheme: ColorSchemeName): boolean {
  if (mode === 'system') {
    return systemScheme === 'dark';
  }
  return mode === 'dark';
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: 'system',
  isDark: Appearance.getColorScheme() === 'dark',
  systemColorScheme: Appearance.getColorScheme(),

  initialize: async () => {
    const systemScheme = Appearance.getColorScheme();

    // Load saved preference
    const savedMode = await storage.getString(THEME_STORAGE_KEY) as ThemeMode | null;
    const mode = savedMode || 'system';

    set({
      mode,
      systemColorScheme: systemScheme,
      isDark: resolveIsDark(mode, systemScheme),
    });

    // Listen for system theme changes
    Appearance.addChangeListener(({ colorScheme }) => {
      const currentMode = get().mode;
      set({
        systemColorScheme: colorScheme,
        isDark: resolveIsDark(currentMode, colorScheme),
      });
    });
  },

  setMode: async (mode: ThemeMode) => {
    await storage.setString(THEME_STORAGE_KEY, mode);
    const { systemColorScheme } = get();
    set({
      mode,
      isDark: resolveIsDark(mode, systemColorScheme),
    });
  },
}));

// Selector hooks for common patterns
export const useIsDark = () => useThemeStore((state) => state.isDark);
export const useThemeMode = () => useThemeStore((state) => state.mode);
