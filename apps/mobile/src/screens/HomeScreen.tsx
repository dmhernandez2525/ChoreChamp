import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { useAuthStore } from '../stores/auth-store';

export function HomeScreen() {
  const { user, signOut, isLoading } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView contentContainerClassName="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Hello, {user?.name || 'Champion'}!
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">
            Ready to conquer your chores today?
          </Text>
        </View>

        {/* Quick Stats Placeholder */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {"Today's Overview"}
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-3xl font-bold text-primary-500 dark:text-primary-400">0</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Chores</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold text-success-500 dark:text-success-400">0</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Completed</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold text-warning-500 dark:text-warning-400">0</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Points</Text>
            </View>
          </View>
        </View>

        {/* Streak Card Placeholder */}
        <View className="bg-primary-500 dark:bg-primary-600 rounded-2xl p-6 mb-6">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-lg font-semibold">Current Streak</Text>
              <Text className="text-white/80 text-sm">Keep up the great work!</Text>
            </View>
            <View className="items-center">
              <Text className="text-4xl">🔥</Text>
              <Text className="text-white text-2xl font-bold">0</Text>
              <Text className="text-white/80 text-xs">days</Text>
            </View>
          </View>
        </View>

        {/* Coming Soon Notice */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 shadow-sm border border-dashed border-gray-300 dark:border-gray-600">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            More Features Coming Soon!
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            • Chore list with swipe actions{'\n'}
            • Rewards store{'\n'}
            • Leaderboard{'\n'}
            • Push notifications{'\n'}
            • And much more!
          </Text>
        </View>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          variant="outline"
          onPress={signOut}
          isLoading={isLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
