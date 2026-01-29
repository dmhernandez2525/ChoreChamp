import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/auth-store';
import { useNotificationStore } from '../stores/notification-store';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { NotificationSettingsScreen, WidgetSettingsScreen, SoundsAndHapticsScreen } from '../screens/settings';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <View className="flex-1 bg-primary-500 items-center justify-center">
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { initialize: initializeNotifications } = useNotificationStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      initializeNotifications();
    }
  }, [isAuthenticated, initializeNotifications]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="WidgetSettings"
            component={WidgetSettingsScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="SoundsAndHaptics"
            component={SoundsAndHapticsScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
