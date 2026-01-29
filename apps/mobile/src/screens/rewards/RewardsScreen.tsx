import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Reward } from '@chorechamp/types';
import { useHouseholdStore } from '../../stores/household-store';
import { useSyncStore } from '../../stores/sync-store';
import { apiClient } from '../../lib/api-client';
import { queueOfflineOperation, generateLocalId } from '../../sync';
import { checkNetworkStatus } from '../../hooks/use-network-status';
import { Button } from '../../components/ui';

export function RewardsScreen() {
  const {
    rewards,
    loadRewards,
    activeHousehold,
    activeMember,
    isLoadingRewards,
  } = useHouseholdStore();
  const { sync, isSyncing } = useSyncStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (activeHousehold) {
      loadRewards();
    }
  }, [activeHousehold, loadRewards]);

  const onRefresh = async () => {
    setRefreshing(true);
    await sync();
    await loadRewards();
    setRefreshing(false);
  };

  const canAfford = (reward: Reward) => {
    return (activeMember?.pointsCurrent || 0) >= reward.pointCost;
  };

  const handleRedeemReward = async () => {
    if (!selectedReward || !activeHousehold || !activeMember) return;

    if (!canAfford(selectedReward)) {
      Alert.alert(
        'Not Enough Points',
        `You need ${selectedReward.pointCost - (activeMember.pointsCurrent || 0)} more ${
          activeHousehold.pointsName || 'points'
        } to redeem this reward.`
      );
      return;
    }

    setIsRedeeming(true);

    try {
      const { isConnected } = await checkNetworkStatus();

      if (isConnected) {
        await apiClient.redeemReward(
          activeHousehold.id,
          selectedReward.id,
          activeMember.id
        );
      } else {
        // Queue for offline sync
        const localId = generateLocalId();
        await queueOfflineOperation({
          operationType: 'create',
          entityType: 'redemption',
          entityId: localId,
          payload: {
            rewardId: selectedReward.id,
            memberId: activeMember.id,
          },
        });
      }

      setSelectedReward(null);
      await loadRewards();

      Alert.alert(
        'Reward Redeemed! 🎉',
        `${selectedReward.title} has been requested! A parent will approve it soon.`,
        [{ text: 'Awesome!' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to redeem reward'
      );
    } finally {
      setIsRedeeming(false);
    }
  };

  const getRewardIcon = (type: Reward['type']) => {
    switch (type) {
      case 'screen_time':
        return '📱';
      case 'money':
        return '💰';
      case 'privilege':
        return '⭐';
      case 'activity':
        return '🎮';
      default:
        return '🎁';
    }
  };

  const renderRewardItem = ({ item }: { item: Reward }) => {
    const affordable = canAfford(item);
    const isOutOfStock = item.quantity !== null && (item.quantityRemaining ?? 0) <= 0;

    return (
      <TouchableOpacity
        className={`bg-white mx-6 mb-3 rounded-2xl overflow-hidden ${
          !affordable || isOutOfStock ? 'opacity-60' : ''
        }`}
        onPress={() => !isOutOfStock && setSelectedReward(item)}
        disabled={isOutOfStock}
      >
        <View className="p-4 flex-row items-center">
          {/* Icon */}
          <View className="w-14 h-14 bg-primary-50 rounded-xl items-center justify-center mr-4">
            <Text className="text-3xl">{item.icon || getRewardIcon(item.type)}</Text>
          </View>

          {/* Content */}
          <View className="flex-1">
            <Text className="font-semibold text-base text-gray-900">{item.title}</Text>
            {item.description && (
              <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View className="flex-row items-center mt-2">
              <View
                className={`px-3 py-1 rounded-full ${
                  affordable ? 'bg-success-100' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    affordable ? 'text-success-700' : 'text-gray-600'
                  }`}
                >
                  {item.pointCost} {activeHousehold?.pointsName || 'points'}
                </Text>
              </View>
              {isOutOfStock && (
                <View className="ml-2 bg-danger-100 px-2 py-1 rounded-full">
                  <Text className="text-danger-700 text-xs font-medium">Out of Stock</Text>
                </View>
              )}
              {item.quantity !== null && !isOutOfStock && (
                <Text className="ml-2 text-gray-400 text-xs">
                  {item.quantityRemaining} left
                </Text>
              )}
            </View>
          </View>

          {/* Arrow */}
          {!isOutOfStock && (
            <Text className="text-gray-300 text-xl ml-2">›</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Rewards Store</Text>
        <View className="mt-3 bg-white rounded-2xl p-4 flex-row items-center">
          <View className="w-12 h-12 bg-primary-100 rounded-xl items-center justify-center mr-3">
            <Text className="text-2xl">💎</Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-500 text-sm">Your Balance</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {activeMember?.pointsCurrent || 0}{' '}
              <Text className="text-base font-normal text-gray-500">
                {activeHousehold?.pointsName || 'points'}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Rewards List */}
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        renderItem={renderRewardItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isSyncing || isLoadingRewards}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12 px-6">
            <Text className="text-4xl mb-4">🎁</Text>
            <Text className="text-gray-900 font-medium text-lg text-center">
              No rewards available
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Ask a parent to add some rewards you can earn!
            </Text>
          </View>
        }
        contentContainerStyle={rewards.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      />

      {/* Reward Detail Modal */}
      <Modal
        visible={selectedReward !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedReward(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl">
            {selectedReward && (
              <>
                {/* Header */}
                <View className="items-center pt-6 pb-4 px-6 border-b border-gray-100">
                  <View className="w-20 h-20 bg-primary-50 rounded-2xl items-center justify-center mb-4">
                    <Text className="text-5xl">
                      {selectedReward.icon || getRewardIcon(selectedReward.type)}
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-gray-900 text-center">
                    {selectedReward.title}
                  </Text>
                  {selectedReward.description && (
                    <Text className="text-gray-500 text-center mt-2">
                      {selectedReward.description}
                    </Text>
                  )}
                </View>

                {/* Cost */}
                <View className="p-6 border-b border-gray-100">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Cost</Text>
                    <Text className="text-xl font-bold text-primary-600">
                      {selectedReward.pointCost} {activeHousehold?.pointsName || 'points'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-3">
                    <Text className="text-gray-600">Your Balance</Text>
                    <Text
                      className={`text-xl font-bold ${
                        canAfford(selectedReward) ? 'text-success-600' : 'text-danger-600'
                      }`}
                    >
                      {activeMember?.pointsCurrent || 0}
                    </Text>
                  </View>
                  {!canAfford(selectedReward) && (
                    <View className="mt-4 bg-danger-50 rounded-xl p-3">
                      <Text className="text-danger-700 text-center text-sm">
                        You need{' '}
                        {selectedReward.pointCost - (activeMember?.pointsCurrent || 0)} more{' '}
                        {activeHousehold?.pointsName || 'points'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View className="p-6 pb-10">
                  <Button
                    title={canAfford(selectedReward) ? 'Redeem Reward' : 'Not Enough Points'}
                    onPress={handleRedeemReward}
                    isLoading={isRedeeming}
                    disabled={!canAfford(selectedReward)}
                    size="lg"
                    className="mb-3"
                  />
                  <Button
                    title="Cancel"
                    variant="ghost"
                    onPress={() => setSelectedReward(null)}
                    size="lg"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
