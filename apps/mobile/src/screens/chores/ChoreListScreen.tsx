import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { TodayChore } from '@chorechamp/types';
import { useHouseholdStore } from '../../stores/household-store';
import { useSyncStore } from '../../stores/sync-store';
import { apiClient } from '../../lib/api-client';
import { queueOfflineOperation, generateLocalId } from '../../sync';
import { checkNetworkStatus } from '../../hooks/use-network-status';

type FilterType = 'all' | 'todo' | 'completed';

export function ChoreListScreen() {
  const {
    todayChores,
    loadTodayChores,
    activeHousehold,
    activeMember,
    isLoading,
  } = useHouseholdStore();
  const { sync, isSyncing } = useSyncStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const filteredChores = todayChores.filter((item) => {
    // Filter by completion status
    if (filter === 'todo' && item.isCompleted) return false;
    if (filter === 'completed' && !item.isCompleted) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = item.chore?.title?.toLowerCase() || '';
      const category = item.chore?.category?.toLowerCase() || '';
      return title.includes(query) || category.includes(query);
    }

    return true;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await sync();
    await loadTodayChores();
    setRefreshing(false);
  }, [sync, loadTodayChores]);

  const handleCompleteChore = async (item: TodayChore) => {
    if (!activeHousehold || !activeMember || item.isCompleted) return;

    setCompletingId(item.id);

    try {
      const { isConnected } = await checkNetworkStatus();

      if (isConnected) {
        // Complete via API
        await apiClient.completeChore(activeHousehold.id, item.choreId, {
          scheduledDate: item.scheduledDate,
        });
      } else {
        // Queue for offline sync
        const localId = generateLocalId();
        await queueOfflineOperation({
          operationType: 'complete',
          entityType: 'completion',
          entityId: localId,
          payload: {
            choreId: item.choreId,
            scheduledDate: item.scheduledDate,
            memberId: activeMember.id,
          },
        });
      }

      // Refresh the list
      await loadTodayChores();

      // Show success feedback
      Alert.alert(
        'Chore Completed! 🎉',
        `You earned ${item.chore?.pointValue || 0} ${activeHousehold.pointsName || 'points'}!`,
        [{ text: 'Awesome!' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to complete chore'
      );
    } finally {
      setCompletingId(null);
    }
  };

  const renderRightActions = (item: TodayChore) => {
    if (item.isCompleted) return null;

    return (
      <TouchableOpacity
        className="bg-success-500 justify-center items-center px-6"
        onPress={() => handleCompleteChore(item)}
      >
        <Text className="text-white text-2xl">✓</Text>
        <Text className="text-white text-xs font-medium mt-1">Done</Text>
      </TouchableOpacity>
    );
  };

  const renderChoreItem = ({ item }: { item: TodayChore }) => {
    const isCompleting = completingId === item.id;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
      >
        <TouchableOpacity
          className={`bg-white p-4 flex-row items-center border-b border-gray-100 ${
            isCompleting ? 'opacity-50' : ''
          }`}
          onPress={() => {
            if (!item.isCompleted) {
              handleCompleteChore(item);
            }
          }}
          disabled={isCompleting}
        >
          {/* Icon */}
          <View
            className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
              item.isCompleted ? 'bg-success-100' : 'bg-gray-100'
            }`}
          >
            <Text className="text-2xl">
              {item.isCompleted ? '✓' : item.chore?.icon || '📋'}
            </Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text
              className={`font-semibold text-base ${
                item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
              }`}
            >
              {item.chore?.title || 'Chore'}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-gray-500 text-sm">
                {item.chore?.pointValue || 0} {activeHousehold?.pointsName || 'points'}
              </Text>
              {item.chore?.difficulty && (
                <>
                  <Text className="text-gray-300 mx-2">•</Text>
                  <Text
                    className={`text-sm capitalize ${
                      item.chore.difficulty === 'easy'
                        ? 'text-success-600'
                        : item.chore.difficulty === 'medium'
                        ? 'text-warning-600'
                        : 'text-danger-600'
                    }`}
                  >
                    {item.chore.difficulty}
                  </Text>
                </>
              )}
              {item.chore?.estimatedMinutes && (
                <>
                  <Text className="text-gray-300 mx-2">•</Text>
                  <Text className="text-gray-500 text-sm">
                    ~{item.chore.estimatedMinutes}min
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View
            className={`px-3 py-1 rounded-full ${
              item.isCompleted ? 'bg-success-100' : 'bg-primary-100'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                item.isCompleted ? 'text-success-700' : 'text-primary-700'
              }`}
            >
              {item.isCompleted ? 'Done' : 'To Do'}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const FilterButton = ({
    type,
    label,
    count,
  }: {
    type: FilterType;
    label: string;
    count: number;
  }) => (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full mr-2 ${
        filter === type ? 'bg-primary-500' : 'bg-gray-100'
      }`}
      onPress={() => setFilter(type)}
    >
      <Text
        className={`text-sm font-medium ${
          filter === type ? 'text-white' : 'text-gray-600'
        }`}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const todoCount = todayChores.filter((c) => !c.isCompleted).length;
  const completedCount = todayChores.filter((c) => c.isCompleted).length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">{"Today's Chores"}</Text>
          <Text className="text-gray-500 mt-1">
            {todoCount === 0
              ? 'All done for today!'
              : `${todoCount} chore${todoCount !== 1 ? 's' : ''} remaining`}
          </Text>
        </View>

        {/* Search */}
        <View className="px-6 py-3">
          <View className="bg-white rounded-xl px-4 py-3 flex-row items-center">
            <Text className="text-gray-400 mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-base text-gray-900"
              placeholder="Search chores..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text className="text-gray-400">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters */}
        <View className="px-6 pb-3">
          <View className="flex-row">
            <FilterButton type="all" label="All" count={todayChores.length} />
            <FilterButton type="todo" label="To Do" count={todoCount} />
            <FilterButton type="completed" label="Done" count={completedCount} />
          </View>
        </View>

        {/* Swipe Hint */}
        {todoCount > 0 && (
          <View className="px-6 pb-2">
            <Text className="text-gray-400 text-xs">
              💡 Swipe left or tap to complete a chore
            </Text>
          </View>
        )}

        {/* List */}
        <FlatList
          data={filteredChores}
          keyExtractor={(item) => item.id}
          renderItem={renderChoreItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isSyncing || isLoading}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-4xl mb-4">
                {filter === 'completed' ? '📋' : '🎉'}
              </Text>
              <Text className="text-gray-900 font-medium text-lg">
                {filter === 'completed'
                  ? 'No completed chores yet'
                  : searchQuery
                  ? 'No chores match your search'
                  : 'No chores for today!'}
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                {filter === 'completed'
                  ? 'Complete some chores to see them here'
                  : searchQuery
                  ? 'Try a different search term'
                  : 'Enjoy your free time!'}
              </Text>
            </View>
          }
          contentContainerStyle={filteredChores.length === 0 ? { flex: 1 } : undefined}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
