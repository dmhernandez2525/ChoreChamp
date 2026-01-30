import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '../stores/theme-store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { isDark, initialize } = useThemeStore();
  const { setColorScheme } = useColorScheme();

  // Initialize theme on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync theme store with NativeWind
  useEffect(() => {
    setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark, setColorScheme]);

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      {children}
    </View>
  );
}
