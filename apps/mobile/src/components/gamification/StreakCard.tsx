import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  getNextStreakMilestone,
  getStreakMilestoneProgress,
  canAffordFreeze,
  getFreezeCost,
} from '@chorechamp/gamification';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freezesAvailable: number;
  freezesUsed: number;
  currentPoints: number;
  isAtRisk?: boolean;
  onPurchaseFreeze?: () => Promise<void>;
  onUseFreeze?: () => Promise<void>;
}

export function StreakCard({
  currentStreak,
  longestStreak,
  lastCompletedDate,
  freezesAvailable,
  freezesUsed,
  currentPoints,
  isAtRisk = false,
  onPurchaseFreeze,
  onUseFreeze,
}: StreakCardProps) {
  const [freezeModalVisible, setFreezeModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const nextMilestone = getNextStreakMilestone(currentStreak);
  const milestoneProgress = getStreakMilestoneProgress(currentStreak);
  const freezeCost = getFreezeCost();
  const canBuyFreeze = canAffordFreeze(currentPoints);

  const handlePurchaseFreeze = async () => {
    if (!onPurchaseFreeze) return;

    setIsProcessing(true);
    try {
      await onPurchaseFreeze();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFreezeModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to purchase freeze');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseFreeze = async () => {
    if (!onUseFreeze || freezesAvailable === 0) return;

    setIsProcessing(true);
    try {
      await onUseFreeze();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFreezeModalVisible(false);
      Alert.alert('Streak Saved!', 'Your streak freeze has been activated.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to use freeze');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStreakEmoji = () => {
    if (currentStreak >= 100) return '👑';
    if (currentStreak >= 30) return '⚡';
    if (currentStreak >= 7) return '🔥';
    return '🔥';
  };

  const getStreakMessage = () => {
    if (isAtRisk) return "Complete a chore to save your streak!";
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak >= 100) return "Legendary streak! Keep it up!";
    if (currentStreak >= 30) return "Amazing dedication!";
    if (currentStreak >= 7) return "You're on fire!";
    return "Building momentum!";
  };

  return (
    <>
      <View
        className={`bg-white rounded-2xl p-4 shadow-sm ${
          isAtRisk ? 'border-2 border-danger-400' : ''
        }`}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-3xl mr-2">{getStreakEmoji()}</Text>
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
              </Text>
              <Text className="text-gray-500 text-sm">{getStreakMessage()}</Text>
            </View>
          </View>

          {/* Freeze button */}
          <TouchableOpacity
            className={`px-3 py-2 rounded-xl flex-row items-center ${
              freezesAvailable > 0 ? 'bg-blue-100' : 'bg-gray-100'
            }`}
            onPress={() => setFreezeModalVisible(true)}
          >
            <Text className="text-lg mr-1">❄️</Text>
            <Text
              className={`font-semibold ${
                freezesAvailable > 0 ? 'text-blue-700' : 'text-gray-500'
              }`}
            >
              {freezesAvailable}
            </Text>
          </TouchableOpacity>
        </View>

        {/* At Risk Warning */}
        {isAtRisk && (
          <View className="bg-danger-50 rounded-xl p-3 mb-4 flex-row items-center">
            <Text className="text-xl mr-2">⚠️</Text>
            <View className="flex-1">
              <Text className="text-danger-700 font-semibold">Streak at Risk!</Text>
              <Text className="text-danger-600 text-sm">
                Complete a chore or use a freeze before midnight
              </Text>
            </View>
            {freezesAvailable > 0 && (
              <TouchableOpacity
                className="bg-danger-500 px-3 py-2 rounded-lg"
                onPress={handleUseFreeze}
              >
                <Text className="text-white font-semibold text-sm">Use Freeze</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Progress to next milestone */}
        {nextMilestone && (
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-500 text-sm">Next milestone</Text>
              <Text className="text-primary-600 font-semibold text-sm">
                {currentStreak}/{nextMilestone} days
              </Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${milestoneProgress * 100}%` }}
              />
            </View>
          </View>
        )}

        {/* Stats row */}
        <View className="flex-row">
          <View className="flex-1 items-center py-2 border-r border-gray-100">
            <Text className="text-gray-500 text-xs">Longest</Text>
            <Text className="text-gray-900 font-bold">{longestStreak} days</Text>
          </View>
          <View className="flex-1 items-center py-2 border-r border-gray-100">
            <Text className="text-gray-500 text-xs">Freezes Used</Text>
            <Text className="text-gray-900 font-bold">{freezesUsed}</Text>
          </View>
          <View className="flex-1 items-center py-2">
            <Text className="text-gray-500 text-xs">Last Completed</Text>
            <Text className="text-gray-900 font-bold">
              {lastCompletedDate
                ? new Date(lastCompletedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Never'}
            </Text>
          </View>
        </View>
      </View>

      {/* Freeze Modal */}
      <Modal
        visible={freezeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFreezeModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="items-center mb-6">
              <Text className="text-5xl mb-2">❄️</Text>
              <Text className="text-2xl font-bold text-gray-900">Streak Freeze</Text>
              <Text className="text-gray-500 text-center mt-2">
                Protect your streak when you miss a day
              </Text>
            </View>

            {/* Current freezes */}
            <View className="bg-blue-50 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-blue-700 font-medium">Available Freezes</Text>
                <Text className="text-blue-900 font-bold text-xl">{freezesAvailable}</Text>
              </View>
            </View>

            {/* Purchase option */}
            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <Text className="text-gray-700 font-medium mb-2">Purchase Freeze</Text>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Text className="text-gray-500">Cost:</Text>
                  <Text className="text-primary-600 font-bold ml-2">{freezeCost} points</Text>
                </View>
                <Text className="text-gray-500">
                  Balance: <Text className="font-semibold">{currentPoints}</Text>
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View className="space-y-3">
              {freezesAvailable > 0 && isAtRisk && (
                <TouchableOpacity
                  className="bg-blue-500 rounded-xl py-4 items-center"
                  onPress={handleUseFreeze}
                  disabled={isProcessing}
                >
                  <Text className="text-white font-semibold text-lg">
                    {isProcessing ? 'Using...' : 'Use Freeze Now'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${
                  canBuyFreeze ? 'bg-primary-500' : 'bg-gray-200'
                }`}
                onPress={handlePurchaseFreeze}
                disabled={!canBuyFreeze || isProcessing}
              >
                <Text
                  className={`font-semibold text-lg ${
                    canBuyFreeze ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {isProcessing ? 'Purchasing...' : `Buy Freeze (${freezeCost} pts)`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-3 items-center"
                onPress={() => setFreezeModalVisible(false)}
              >
                <Text className="text-gray-500 font-medium">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
