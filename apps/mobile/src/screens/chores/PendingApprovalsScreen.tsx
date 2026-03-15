import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { ChoreCompletion } from '@chorechamp/types';
import { useHouseholdStore } from '../../stores/household-store';
import { apiClient } from '../../lib/api-client';

interface PendingCompletion extends ChoreCompletion {
  choreName: string;
  choreIcon: string;
  memberName: string;
  memberColor: string;
}

export function PendingApprovalsScreen() {
  const { activeHousehold, activeMember } = useHouseholdStore();
  const [pendingCompletions, setPendingCompletions] = useState<PendingCompletion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Rejection modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState<PendingCompletion | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isParent = activeMember?.role === 'parent';

  const loadPendingCompletions = useCallback(async () => {
    if (!activeHousehold) return;

    try {
      const completions = await apiClient.getPendingCompletions(activeHousehold.id);
      setPendingCompletions(completions as PendingCompletion[]);
    } catch (error) {
      console.error('Failed to load pending completions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeHousehold]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPendingCompletions();
    setRefreshing(false);
  }, [loadPendingCompletions]);

  React.useEffect(() => {
    loadPendingCompletions();
  }, [loadPendingCompletions]);

  const handleApprove = async (completion: PendingCompletion) => {
    if (!activeHousehold) return;

    setIsProcessing(true);
    try {
      await apiClient.approveCompletion(activeHousehold.id, completion.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Remove from list
      setPendingCompletions((prev) =>
        prev.filter((c) => c.id !== completion.id)
      );

      Alert.alert(
        'Approved!',
        `${completion.memberName}'s chore "${completion.choreName}" has been approved.`
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to approve completion'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (completion: PendingCompletion) => {
    setSelectedCompletion(completion);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!activeHousehold || !selectedCompletion) return;

    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejection.');
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.rejectCompletion(
        activeHousehold.id,
        selectedCompletion.id,
        rejectionReason.trim()
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Remove from list
      setPendingCompletions((prev) =>
        prev.filter((c) => c.id !== selectedCompletion.id)
      );

      setRejectModalVisible(false);
      setSelectedCompletion(null);

      Alert.alert(
        'Rejected',
        `${selectedCompletion.memberName}'s chore has been sent back for rework.`
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to reject completion'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCompletionItem = ({ item }: { item: PendingCompletion }) => {
    const completedDate = new Date(item.completedAt);
    const timeAgo = formatTimeAgo(completedDate);

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        {/* Header */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: item.memberColor + '30' }}
          >
            <Text className="font-semibold" style={{ color: item.memberColor }}>
              {item.memberName.charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-900">{item.memberName}</Text>
            <Text className="text-gray-500 text-sm">{timeAgo}</Text>
          </View>
          <View className="bg-warning-100 px-3 py-1 rounded-full">
            <Text className="text-warning-700 text-xs font-medium">Pending</Text>
          </View>
        </View>

        {/* Chore info */}
        <View className="flex-row items-center mb-3 bg-gray-50 p-3 rounded-xl">
          <Text className="text-2xl mr-3">{item.choreIcon}</Text>
          <View className="flex-1">
            <Text className="font-medium text-gray-900">{item.choreName}</Text>
            <Text className="text-primary-600 text-sm">
              +{item.pointsAwarded} points
            </Text>
          </View>
        </View>

        {/* Photo proof if available */}
        {item.photoUrl && (
          <TouchableOpacity className="mb-3">
            <Image
              source={{ uri: item.photoUrl }}
              className="w-full h-48 rounded-xl"
              resizeMode="cover"
            />
            <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-lg">
              <Text className="text-white text-xs">Photo proof</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Duration if tracked */}
        {item.durationSeconds && (
          <View className="flex-row items-center mb-3">
            <Text className="text-gray-500 mr-2">Completed in:</Text>
            <Text className="text-gray-700 font-medium">
              {Math.floor(item.durationSeconds / 60)}m {item.durationSeconds % 60}s
            </Text>
          </View>
        )}

        {/* Action buttons */}
        {isParent && (
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-danger-100 rounded-xl py-3 items-center"
              onPress={() => openRejectModal(item)}
              disabled={isProcessing}
            >
              <Text className="text-danger-700 font-semibold">Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-success-500 rounded-xl py-3 items-center"
              onPress={() => handleApprove(item)}
              disabled={isProcessing}
            >
              <Text className="text-white font-semibold">Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (!isParent) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-4xl mb-4">🔒</Text>
        <Text className="text-xl font-semibold text-gray-900 text-center">
          Parents Only
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Only parents can approve or reject chore completions.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Pending Approvals</Text>
        <Text className="text-gray-500 mt-1">
          {pendingCompletions.length === 0
            ? 'All caught up!'
            : `${pendingCompletions.length} chore${pendingCompletions.length !== 1 ? 's' : ''} waiting for review`}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={pendingCompletions}
        keyExtractor={(item) => item.id}
        renderItem={renderCompletionItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-5xl mb-4">🎉</Text>
            <Text className="text-gray-900 font-medium text-lg">All Caught Up!</Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              No chores are waiting for approval right now.
            </Text>
          </View>
        }
      />

      {/* Rejection Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 mb-2">
              Reject Completion
            </Text>
            <Text className="text-gray-500 mb-4">
              Let {selectedCompletion?.memberName} know why their chore needs rework.
            </Text>

            <TextInput
              className="bg-gray-100 rounded-xl p-4 text-base text-gray-900 min-h-[100px]"
              placeholder="Reason for rejection..."
              placeholderTextColor="#9ca3af"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-xl py-4 items-center"
                onPress={() => setRejectModalVisible(false)}
                disabled={isProcessing}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-danger-500 rounded-xl py-4 items-center"
                onPress={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
              >
                <Text className="text-white font-semibold">
                  {isProcessing ? 'Rejecting...' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
