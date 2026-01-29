import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../stores/auth-store';
import { useSyncStore } from '../../stores/sync-store';
import { useHouseholdStore } from '../../stores/household-store';
import { NetworkStatusIndicator } from '../../components/ui';
import type { MainTabParamList } from '../../navigation/types';

type NavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { sync, isSyncing } = useSyncStore();
  const {
    activeHousehold,
    activeMember,
    todayChores,
    loadTodayChores,
    isLoading
  } = useHouseholdStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeHousehold && activeMember) {
      loadTodayChores();
    }
  }, [activeHousehold, activeMember, loadTodayChores]);

  const onRefresh = async () => {
    setRefreshing(true);
    await sync();
    await loadTodayChores();
    setRefreshing(false);
  };

  const completedCount = todayChores.filter(c => c.isCompleted).length;
  const totalCount = todayChores.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView
        contentContainerClassName="pb-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isSyncing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              {greeting()}, {activeMember?.name || user?.name || 'Champion'}!
            </Text>
            <Text className="text-gray-500 mt-1">
              {activeHousehold?.name || 'Select a household'}
            </Text>
          </View>
          <NetworkStatusIndicator />
        </View>

        {/* Today's Progress Card */}
        <View className="mx-6 mt-4 bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            {"Today's Progress"}
          </Text>

          {/* Progress Bar */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">
                {completedCount} of {totalCount} chores
              </Text>
              <Text className="text-primary-600 font-semibold">
                {completionPercentage}%
              </Text>
            </View>
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </View>
          </View>

          {/* Quick Stats */}
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-primary-500">
                {activeMember?.pointsCurrent || 0}
              </Text>
              <Text className="text-gray-500 text-sm">
                {activeHousehold?.pointsName || 'Points'}
              </Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-success-500">
                {completedCount}
              </Text>
              <Text className="text-gray-500 text-sm">Completed</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center flex-1">
              <Text className="text-3xl font-bold text-warning-500">
                {totalCount - completedCount}
              </Text>
              <Text className="text-gray-500 text-sm">Remaining</Text>
            </View>
          </View>
        </View>

        {/* Streak Card */}
        <View className="mx-6 mt-4 bg-primary-500 rounded-2xl p-6">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold">Current Streak</Text>
              <Text className="text-white/80 text-sm mt-1">
                {activeMember?.streakCurrent === 0
                  ? 'Complete a chore to start your streak!'
                  : 'Keep up the great work!'}
              </Text>
            </View>
            <View className="items-center ml-4">
              <Text className="text-5xl mb-1">🔥</Text>
              <Text className="text-white text-3xl font-bold">
                {activeMember?.streakCurrent || 0}
              </Text>
              <Text className="text-white/80 text-xs">days</Text>
            </View>
          </View>

          {activeMember && activeMember.streakLongest > 0 && (
            <View className="mt-4 pt-4 border-t border-white/20">
              <Text className="text-white/80 text-sm">
                Best streak: {activeMember.streakLongest} days
              </Text>
            </View>
          )}
        </View>

        {/* Today's Chores Preview */}
        <View className="mx-6 mt-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              {"Today's Chores"}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Chores')}>
              <Text className="text-primary-500 font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-gray-500">Loading chores...</Text>
            </View>
          ) : todayChores.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-4xl mb-2">🎉</Text>
              <Text className="text-gray-900 font-medium">No chores for today!</Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Enjoy your free time or help out with extra chores
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-2xl overflow-hidden">
              {todayChores.slice(0, 3).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  className={`p-4 flex-row items-center ${
                    index < Math.min(todayChores.length, 3) - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  onPress={() => navigation.navigate('Chores')}
                >
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                    item.isCompleted ? 'bg-success-100' : 'bg-gray-100'
                  }`}>
                    <Text className="text-xl">
                      {item.isCompleted ? '✓' : item.chore?.icon || '📋'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${
                      item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}>
                      {item.chore?.title || 'Chore'}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {item.chore?.pointValue || 0} {activeHousehold?.pointsName || 'points'}
                    </Text>
                  </View>
                  {!item.isCompleted && (
                    <View className="bg-primary-100 px-3 py-1 rounded-full">
                      <Text className="text-primary-700 text-xs font-medium">To Do</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {todayChores.length > 3 && (
                <TouchableOpacity
                  className="p-3 bg-gray-50"
                  onPress={() => navigation.navigate('Chores')}
                >
                  <Text className="text-primary-500 text-center font-medium">
                    +{todayChores.length - 3} more chores
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-6 mt-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4 items-center"
              onPress={() => navigation.navigate('Rewards')}
            >
              <Text className="text-3xl mb-2">🎁</Text>
              <Text className="text-gray-900 font-medium">Rewards</Text>
              <Text className="text-gray-500 text-xs">Redeem points</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4 items-center"
              onPress={() => navigation.navigate('Profile')}
            >
              <Text className="text-3xl mb-2">🏆</Text>
              <Text className="text-gray-900 font-medium">Badges</Text>
              <Text className="text-gray-500 text-xs">
                {activeMember?.badges?.length || 0} earned
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
