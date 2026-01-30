import './src/styles/global.css';

import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation';
import { initializeDatabase } from './src/db';
import { setupSyncTriggers } from './src/stores/sync-store';
import { NetworkStatusBanner, ErrorBoundary } from './src/components/ui';
import { ThemeProvider } from './src/components/ThemeProvider';
import { useThemeStore } from './src/stores/theme-store';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize SQLite database
        await initializeDatabase();

        // Setup sync triggers for app state changes
        const cleanup = setupSyncTriggers();

        // Store cleanup for component unmount
        return cleanup;
      } catch (e) {
        console.warn('App initialization error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    const cleanupPromise = prepare();

    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  // Custom navigation themes matching our brand colors
  const LightNavTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#6366f1',
      background: '#f9fafb',
      card: '#ffffff',
      text: '#111827',
      border: '#e5e7eb',
    },
  };

  const DarkNavTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#818cf8',
      background: '#111827',
      card: '#1f2937',
      text: '#f9fafb',
      border: '#374151',
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ErrorBoundary>
              <NavigationContainer theme={isDark ? DarkNavTheme : LightNavTheme}>
                <View style={{ flex: 1 }}>
                  <StatusBar style={isDark ? 'light' : 'dark'} />
                  <NetworkStatusBanner />
                  <RootNavigator />
                </View>
              </NavigationContainer>
            </ErrorBoundary>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
