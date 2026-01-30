import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../stores/theme-store';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeOptionProps {
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeOption({ title, description, icon, isSelected, onSelect }: ThemeOptionProps) {
  return (
    <TouchableOpacity
      className={`
        flex-row items-center p-4 mb-3 rounded-xl
        ${isSelected
          ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
          : 'bg-white dark:bg-gray-800 border-2 border-transparent'
        }
      `}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mr-4">
        <Text className="text-2xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className={`
          text-base font-semibold
          ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}
        `}>
          {title}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {description}
        </Text>
      </View>
      {isSelected && (
        <View className="w-6 h-6 rounded-full bg-primary-500 items-center justify-center">
          <Text className="text-white text-sm">✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function ThemeSettingsScreen() {
  const { mode, setMode, isDark } = useThemeStore();

  const themes: { mode: ThemeMode; title: string; description: string; icon: string }[] = [
    {
      mode: 'system',
      title: 'System Default',
      description: 'Automatically match your device settings',
      icon: '📱',
    },
    {
      mode: 'light',
      title: 'Light Mode',
      description: 'Bright and easy on the eyes during the day',
      icon: '☀️',
    },
    {
      mode: 'dark',
      title: 'Dark Mode',
      description: 'Easier on the eyes in low-light environments',
      icon: '🌙',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['bottom']}>
      <ScrollView className="flex-1" contentContainerClassName="p-6">
        {/* Header Info */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mr-4">
              <Text className="text-3xl">{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                Appearance
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                {isDark ? 'Dark mode is currently active' : 'Light mode is currently active'}
              </Text>
            </View>
          </View>
          <Text className="text-gray-600 dark:text-gray-300 text-sm">
            Choose how ChoreChamp looks. You can set it to match your device settings or pick light or dark mode.
          </Text>
        </View>

        {/* Theme Options */}
        <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-3 px-1">
          Choose Theme
        </Text>
        {themes.map((theme) => (
          <ThemeOption
            key={theme.mode}
            title={theme.title}
            description={theme.description}
            icon={theme.icon}
            isSelected={mode === theme.mode}
            onSelect={() => setMode(theme.mode)}
          />
        ))}

        {/* Preview Card */}
        <View className="mt-6">
          <Text className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-3 px-1">
            Preview
          </Text>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center mr-3">
                <Text className="text-white font-bold">CC</Text>
              </View>
              <View>
                <Text className="text-gray-900 dark:text-white font-semibold">ChoreChamp</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">Sample content</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1 bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3 items-center">
                <Text className="text-primary-700 dark:text-primary-300 font-bold text-lg">15</Text>
                <Text className="text-primary-600 dark:text-primary-400 text-xs">Chores</Text>
              </View>
              <View className="flex-1 bg-success-100 dark:bg-success-900/30 rounded-lg p-3 items-center">
                <Text className="text-success-700 dark:text-success-300 font-bold text-lg">12</Text>
                <Text className="text-success-600 dark:text-success-400 text-xs">Done</Text>
              </View>
              <View className="flex-1 bg-warning-100 dark:bg-warning-900/30 rounded-lg p-3 items-center">
                <Text className="text-warning-700 dark:text-warning-300 font-bold text-lg">🔥7</Text>
                <Text className="text-warning-600 dark:text-warning-400 text-xs">Streak</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
