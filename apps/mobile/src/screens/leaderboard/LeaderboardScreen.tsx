import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import type { LeaderboardEntry } from '@chorechamp/types';
import { useHouseholdStore } from '../../stores/household-store';
import { apiClient } from '../../lib/api-client';

type Period = 'week' | 'month' | 'all';

export function LeaderboardScreen() {
  const navigation = useNavigation();
  const { activeHousehold, activeMember } = useHouseholdStore();

  const [period, setPeriod] = useState<Period>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    if (!activeHousehold) return;

    try {
      const data = await apiClient.getLeaderboard(activeHousehold.id, period);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeHousehold, period]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  }, [loadLeaderboard]);

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod !== period) {
      setPeriod(newPeriod);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsLoading(true);
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600';
      case 2: return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
      case 3: return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600';
      default: return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const renderPeriodButton = (buttonPeriod: Period, label: string) => (
    <TouchableOpacity
      className={`flex-1 py-2 px-4 rounded-xl ${
        period === buttonPeriod ? 'bg-primary-500 dark:bg-primary-600' : 'bg-gray-100 dark:bg-gray-800'
      }`}
      onPress={() => handlePeriodChange(buttonPeriod)}
    >
      <Text
        className={`text-center font-semibold ${
          period === buttonPeriod ? 'text-white' : 'text-gray-600 dark:text-gray-300'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = item.memberId === activeMember?.id;
    const rank = item.rank || index + 1;

    return (
      <View
        className={`mx-4 mb-3 p-4 rounded-xl border-2 ${getRankStyle(rank)} ${
          isCurrentUser ? 'border-primary-500 dark:border-primary-400' : ''
        }`}
      >
        <View className="flex-row items-center">
          {/* Rank */}
          <View className="w-12 items-center">
            <Text className={`${rank <= 3 ? 'text-2xl' : 'text-lg font-bold text-gray-500 dark:text-gray-400'}`}>
              {getRankEmoji(rank)}
            </Text>
          </View>

          {/* Avatar */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: item.memberColor + '30' }}
          >
            <Text className="text-xl font-bold" style={{ color: item.memberColor }}>
              {item.memberName.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Name and stats */}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className={`font-semibold text-base ${isCurrentUser ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                {item.memberName}
              </Text>
              {isCurrentUser && (
                <View className="ml-2 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                  <Text className="text-primary-600 dark:text-primary-300 text-xs font-medium">You</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">
              {item.completedChores} chore{item.completedChores !== 1 ? 's' : ''} completed
            </Text>
          </View>

          {/* Points */}
          <View className="items-end">
            <Text className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {item.totalPoints.toLocaleString()}
            </Text>
            <Text className="text-gray-400 dark:text-gray-500 text-xs">points</Text>
          </View>
        </View>
      </View>
    );
  };

  // Top 3 podium component
  const renderPodium = () => {
    if (leaderboard.length < 3) return null;

    const [first, second, third] = leaderboard.slice(0, 3);

    const PodiumPosition = ({ entry, position }: { entry: LeaderboardEntry; position: 1 | 2 | 3 }) => {
      const heights = { 1: 'h-28', 2: 'h-20', 3: 'h-16' };
      const emojis = { 1: '🥇', 2: '🥈', 3: '🥉' };
      const colors = { 1: 'bg-yellow-400 dark:bg-yellow-500', 2: 'bg-gray-300 dark:bg-gray-500', 3: 'bg-orange-400 dark:bg-orange-500' };

      return (
        <View className="items-center flex-1">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mb-2"
            style={{ backgroundColor: entry.memberColor + '40' }}
          >
            <Text className="text-2xl">{emojis[position]}</Text>
          </View>
          <Text className="font-semibold text-gray-900 dark:text-white text-center" numberOfLines={1}>
            {entry.memberName}
          </Text>
          <Text className="text-primary-600 dark:text-primary-400 font-bold">{entry.totalPoints}</Text>
          <View className={`w-full ${heights[position]} ${colors[position]} rounded-t-lg mt-2`} />
        </View>
      );
    };

    return (
      <View className="px-4 mb-4">
        <View className="flex-row items-end justify-center">
          <PodiumPosition entry={second} position={2} />
          <PodiumPosition entry={first} position={1} />
          <PodiumPosition entry={third} position={3} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            className="mr-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-primary-600 dark:text-primary-400 text-lg">← Back</Text>
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</Text>
            <Text className="text-gray-500 dark:text-gray-400">{activeHousehold?.name}</Text>
          </View>
        </View>

        {/* Period selector */}
        <View className="flex-row gap-2">
          {renderPeriodButton('week', 'This Week')}
          {renderPeriodButton('month', 'This Month')}
          {renderPeriodButton('all', 'All Time')}
        </View>
      </View>

      {/* Podium for top 3 */}
      {!isLoading && leaderboard.length >= 3 && renderPodium()}

      {/* Full list */}
      <FlatList
        data={leaderboard.slice(3)} // Skip top 3 if podium shown
        keyExtractor={(item) => item.memberId}
        renderItem={({ item, index }) => renderLeaderboardItem({ item, index: index + 3 })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListHeaderComponent={
          leaderboard.length < 3 ? (
            <View className="px-4">
              {leaderboard.slice(0, 3).map((item, index) => (
                <View key={item.memberId}>
                  {renderLeaderboardItem({ item, index })}
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-5xl mb-4">🏆</Text>
              <Text className="text-gray-900 dark:text-white font-medium text-lg">No Rankings Yet</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 px-8">
                Complete chores to appear on the leaderboard!
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={leaderboard.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
