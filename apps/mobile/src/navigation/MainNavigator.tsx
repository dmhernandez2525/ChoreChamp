import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screens for tabs - will be fully built in F5.3
function ChoresScreen() {
  return (
    <View className="flex-1 bg-gray-50 items-center justify-center">
      <Text className="text-6xl mb-4">📋</Text>
      <Text className="text-xl font-semibold text-gray-900">Chores</Text>
      <Text className="text-gray-500">Coming in F5.3</Text>
    </View>
  );
}

function RewardsScreen() {
  return (
    <View className="flex-1 bg-gray-50 items-center justify-center">
      <Text className="text-6xl mb-4">🎁</Text>
      <Text className="text-xl font-semibold text-gray-900">Rewards</Text>
      <Text className="text-gray-500">Coming in F5.3</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View className="flex-1 bg-gray-50 items-center justify-center">
      <Text className="text-6xl mb-4">👤</Text>
      <Text className="text-xl font-semibold text-gray-900">Profile</Text>
      <Text className="text-gray-500">Coming in F5.3</Text>
    </View>
  );
}

// Tab icon component
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View
      className={`w-12 h-12 rounded-xl items-center justify-center ${
        focused ? 'bg-primary-100' : 'bg-transparent'
      }`}
    >
      <Text className="text-2xl">{emoji}</Text>
    </View>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 72,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chores"
        component={ChoresScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎁" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
