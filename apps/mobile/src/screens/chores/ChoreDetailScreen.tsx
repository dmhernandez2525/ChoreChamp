import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import type { TodayChore } from '@chorechamp/types';
import { ChoreTimer } from '../../components/chores/ChoreTimer';
import { ChoreSteps } from '../../components/chores/ChoreSteps';
import { ChoreCompletionWithPhoto } from '../../components/photo/ChoreCompletionWithPhoto';
import { useHouseholdStore } from '../../stores/household-store';
import { apiClient } from '../../lib/api-client';

type ChoreDetailParams = {
  ChoreDetail: {
    chore: TodayChore;
  };
};

type ChoreDetailRouteProp = RouteProp<ChoreDetailParams, 'ChoreDetail'>;

export function ChoreDetailScreen() {
  const route = useRoute<ChoreDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<ChoreDetailParams>>();
  const { chore: todayChore } = route.params;

  const { activeHousehold, activeMember, loadTodayChores } = useHouseholdStore();
  const chore = todayChore.chore;

  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState<Date | null>(null);
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const isCompleted = todayChore.isCompleted;
  const completion = todayChore.completion;
  const isPendingApproval = completion?.status === 'pending';
  const isApproved = completion?.status === 'approved';
  const isRejected = completion?.status === 'rejected';

  const handleTimerStart = useCallback(() => {
    setTimerStartedAt(new Date());
  }, []);

  const handleTimerComplete = useCallback((durationSeconds: number) => {
    setTimerDuration(durationSeconds);
  }, []);

  const handleStepComplete = useCallback((_: number, completed: number[]) => {
    setCompletedSteps(completed);
  }, []);

  const handleAllStepsComplete = useCallback(() => {
    // Optionally auto-show completion modal when all steps done
    if (!isCompleted) {
      Alert.alert(
        'All Steps Done!',
        'Ready to mark this chore as complete?',
        [
          { text: 'Not Yet', style: 'cancel' },
          {
            text: 'Complete',
            onPress: () => setCompletionModalVisible(true),
          },
        ]
      );
    }
  }, [isCompleted]);

  const handleComplete = async (photoUri?: string) => {
    if (!activeHousehold || !activeMember) return;

    try {
      await apiClient.completeChore(activeHousehold.id, chore.id, {
        scheduledDate: todayChore.scheduledDate,
        photoUrl: photoUri,
        startedAt: timerStartedAt ?? undefined,
        durationSeconds: timerDuration ?? undefined,
      });

      await loadTodayChores();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        chore.requiresApproval ? 'Submitted for Approval!' : 'Chore Complete!',
        chore.requiresApproval
          ? 'A parent will review your work soon.'
          : `You earned ${chore.pointValue} ${activeHousehold.pointsName || 'points'}!`,
        [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      throw error;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 pt-4 pb-6">
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-primary-600">← Back</Text>
          </TouchableOpacity>

          <View className="items-center">
            <View className="w-20 h-20 bg-primary-100 rounded-2xl items-center justify-center mb-4">
              <Text className="text-4xl">{chore.icon}</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              {chore.title}
            </Text>
            {chore.description && (
              <Text className="text-gray-500 text-center mt-2">
                {chore.description}
              </Text>
            )}

            {/* Status badges */}
            <View className="flex-row gap-2 mt-4">
              <View className="bg-primary-100 px-3 py-1 rounded-full">
                <Text className="text-primary-700 font-medium">
                  +{chore.pointValue} {activeHousehold?.pointsName || 'points'}
                </Text>
              </View>
              {chore.difficulty && (
                <View
                  className={`px-3 py-1 rounded-full ${
                    chore.difficulty === 'easy'
                      ? 'bg-success-100'
                      : chore.difficulty === 'medium'
                      ? 'bg-warning-100'
                      : 'bg-danger-100'
                  }`}
                >
                  <Text
                    className={`font-medium capitalize ${
                      chore.difficulty === 'easy'
                        ? 'text-success-700'
                        : chore.difficulty === 'medium'
                        ? 'text-warning-700'
                        : 'text-danger-700'
                    }`}
                  >
                    {chore.difficulty}
                  </Text>
                </View>
              )}
              {chore.requiresApproval && (
                <View className="bg-purple-100 px-3 py-1 rounded-full">
                  <Text className="text-purple-700 font-medium">
                    Needs Approval
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Completion Status Banner */}
        {isCompleted && (
          <View
            className={`mx-6 mt-4 p-4 rounded-xl ${
              isApproved
                ? 'bg-success-100'
                : isRejected
                ? 'bg-danger-100'
                : 'bg-warning-100'
            }`}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">
                {isApproved ? '✓' : isRejected ? '✗' : '⏳'}
              </Text>
              <View className="flex-1">
                <Text
                  className={`font-semibold ${
                    isApproved
                      ? 'text-success-700'
                      : isRejected
                      ? 'text-danger-700'
                      : 'text-warning-700'
                  }`}
                >
                  {isApproved
                    ? 'Approved!'
                    : isRejected
                    ? 'Needs Rework'
                    : 'Waiting for Approval'}
                </Text>
                {isRejected && completion?.rejectionReason && (
                  <Text className="text-danger-600 mt-1">
                    Reason: {completion.rejectionReason}
                  </Text>
                )}
                {isApproved && completion && (
                  <Text className="text-success-600">
                    +{completion.pointsAwarded} points earned
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Requirements info */}
        {!isCompleted && (chore.requiresPhoto || chore.requiresApproval) && (
          <View className="mx-6 mt-4 bg-blue-50 rounded-xl p-4">
            <Text className="text-blue-900 font-semibold mb-2">Requirements</Text>
            {chore.requiresPhoto && (
              <View className="flex-row items-center mb-1">
                <Text className="text-blue-600 mr-2">📸</Text>
                <Text className="text-blue-700">Photo proof required</Text>
              </View>
            )}
            {chore.requiresApproval && (
              <View className="flex-row items-center">
                <Text className="text-blue-600 mr-2">👍</Text>
                <Text className="text-blue-700">Parent approval required</Text>
              </View>
            )}
          </View>
        )}

        {/* Timer section */}
        {chore.showTimer && chore.estimatedMinutes && !isCompleted && (
          <View className="mx-6 mt-4">
            <ChoreTimer
              estimatedMinutes={chore.estimatedMinutes}
              startedAt={timerStartedAt}
              onTimerStart={handleTimerStart}
              onTimerComplete={handleTimerComplete}
            />
          </View>
        )}

        {/* Time estimate without timer */}
        {!chore.showTimer && chore.estimatedMinutes && (
          <View className="mx-6 mt-4 bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">⏱️</Text>
              <View>
                <Text className="text-gray-500 text-sm">Estimated Time</Text>
                <Text className="text-gray-900 font-semibold">
                  {chore.estimatedMinutes} minutes
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Steps section */}
        {chore.steps && chore.steps.length > 0 && !isCompleted && (
          <View className="mx-6 mt-4">
            <ChoreSteps
              steps={chore.steps}
              initialCompletedSteps={completedSteps}
              onStepComplete={handleStepComplete}
              onAllStepsComplete={handleAllStepsComplete}
            />
          </View>
        )}

        {/* Completed steps summary */}
        {chore.steps && chore.steps.length > 0 && isCompleted && (
          <View className="mx-6 mt-4 bg-white rounded-xl p-4 shadow-sm">
            <Text className="font-semibold text-gray-900 mb-2">Steps</Text>
            {chore.steps.map((step, index) => (
              <View key={index} className="flex-row items-center py-2">
                <View className="w-6 h-6 rounded-full bg-success-500 items-center justify-center mr-3">
                  <Text className="text-white text-sm">✓</Text>
                </View>
                <Text className="text-gray-600 line-through">{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Completion info for completed chores */}
        {isCompleted && completion && (
          <View className="mx-6 mt-4 bg-white rounded-xl p-4 shadow-sm">
            <Text className="font-semibold text-gray-900 mb-3">Completion Details</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Completed</Text>
                <Text className="text-gray-900">
                  {new Date(completion.completedAt).toLocaleString()}
                </Text>
              </View>
              {completion.durationSeconds && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Duration</Text>
                  <Text className="text-gray-900">
                    {Math.floor(completion.durationSeconds / 60)}m {completion.durationSeconds % 60}s
                  </Text>
                </View>
              )}
              {completion.approvedAt && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Approved</Text>
                  <Text className="text-gray-900">
                    {new Date(completion.approvedAt).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Complete button */}
      {!isCompleted && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <TouchableOpacity
            className="bg-success-500 rounded-xl py-4 items-center"
            onPress={() => setCompletionModalVisible(true)}
          >
            <Text className="text-white font-semibold text-lg">
              {chore.requiresPhoto ? 'Complete with Photo' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Retry button for rejected chores */}
      {isRejected && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 items-center"
            onPress={() => setCompletionModalVisible(true)}
          >
            <Text className="text-white font-semibold text-lg">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Completion modal */}
      <ChoreCompletionWithPhoto
        visible={completionModalVisible}
        chore={todayChore}
        householdPointsName={activeHousehold?.pointsName}
        onComplete={handleComplete}
        onCancel={() => setCompletionModalVisible(false)}
      />
    </SafeAreaView>
  );
}
