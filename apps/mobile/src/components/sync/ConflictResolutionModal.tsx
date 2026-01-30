import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface SyncConflict {
  id: string;
  entityType: 'chore' | 'member' | 'reward' | 'completion';
  entityId: string;
  entityName: string;
  localVersion: {
    updatedAt: Date;
    data: Record<string, unknown>;
  };
  serverVersion: {
    updatedAt: Date;
    data: Record<string, unknown>;
  };
}

type ResolutionChoice = 'local' | 'server' | 'merge';

interface ConflictResolutionModalProps {
  visible: boolean;
  conflicts: SyncConflict[];
  onResolve: (resolutions: Record<string, ResolutionChoice>) => Promise<void>;
  onDismiss: () => void;
}

export function ConflictResolutionModal({
  visible,
  conflicts,
  onResolve,
  onDismiss,
}: ConflictResolutionModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, ResolutionChoice>>({});
  const [isResolving, setIsResolving] = useState(false);

  const handleChoose = (conflictId: string, choice: ResolutionChoice) => {
    setResolutions((prev) => ({ ...prev, [conflictId]: choice }));
  };

  const handleResolveAll = async () => {
    // Fill in any unresolved conflicts with 'server' as default
    const allResolutions = { ...resolutions };
    conflicts.forEach((conflict) => {
      if (!allResolutions[conflict.id]) {
        allResolutions[conflict.id] = 'server';
      }
    });

    setIsResolving(true);
    try {
      await onResolve(allResolutions);
    } finally {
      setIsResolving(false);
    }
  };

  const handleKeepLocal = () => {
    const allLocal: Record<string, ResolutionChoice> = {};
    conflicts.forEach((conflict) => {
      allLocal[conflict.id] = 'local';
    });
    setResolutions(allLocal);
  };

  const handleKeepServer = () => {
    const allServer: Record<string, ResolutionChoice> = {};
    conflicts.forEach((conflict) => {
      allServer[conflict.id] = 'server';
    });
    setResolutions(allServer);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEntityIcon = (type: SyncConflict['entityType']) => {
    switch (type) {
      case 'chore':
        return '📋';
      case 'member':
        return '👤';
      case 'reward':
        return '🎁';
      case 'completion':
        return '✅';
      default:
        return '📄';
    }
  };

  if (!visible || conflicts.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                Resolve Conflicts
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} found
              </Text>
            </View>
            <TouchableOpacity
              onPress={onDismiss}
              className="p-2"
            >
              <Text className="text-gray-500 dark:text-gray-400 text-2xl">×</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-3 flex-row gap-2 bg-gray-100 dark:bg-gray-800/50">
          <TouchableOpacity
            className="flex-1 bg-white dark:bg-gray-700 rounded-lg py-2 px-4"
            onPress={handleKeepLocal}
          >
            <Text className="text-center text-gray-700 dark:text-gray-200 font-medium text-sm">
              Keep All Local
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white dark:bg-gray-700 rounded-lg py-2 px-4"
            onPress={handleKeepServer}
          >
            <Text className="text-center text-gray-700 dark:text-gray-200 font-medium text-sm">
              Keep All Server
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conflicts List */}
        <ScrollView className="flex-1 px-6 py-4">
          {conflicts.map((conflict) => (
            <View
              key={conflict.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm"
            >
              {/* Conflict Header */}
              <View className="flex-row items-center mb-3">
                <Text className="text-2xl mr-2">{getEntityIcon(conflict.entityType)}</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    {conflict.entityName}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                    {conflict.entityType}
                  </Text>
                </View>
              </View>

              {/* Version Comparison */}
              <View className="flex-row gap-2">
                {/* Local Version */}
                <TouchableOpacity
                  className={`flex-1 p-3 rounded-lg border-2 ${
                    resolutions[conflict.id] === 'local'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                  }`}
                  onPress={() => handleChoose(conflict.id, 'local')}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Local
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(conflict.localVersion.updatedAt)}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-600 dark:text-gray-400" numberOfLines={3}>
                    {JSON.stringify(conflict.localVersion.data, null, 2).slice(0, 100)}...
                  </Text>
                  {resolutions[conflict.id] === 'local' && (
                    <View className="absolute top-2 right-2">
                      <Text className="text-primary-500">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Server Version */}
                <TouchableOpacity
                  className={`flex-1 p-3 rounded-lg border-2 ${
                    resolutions[conflict.id] === 'server'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                  }`}
                  onPress={() => handleChoose(conflict.id, 'server')}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Server
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(conflict.serverVersion.updatedAt)}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-600 dark:text-gray-400" numberOfLines={3}>
                    {JSON.stringify(conflict.serverVersion.data, null, 2).slice(0, 100)}...
                  </Text>
                  {resolutions[conflict.id] === 'server' && (
                    <View className="absolute top-2 right-2">
                      <Text className="text-primary-500">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              isResolving ? 'bg-primary-400' : 'bg-primary-500 dark:bg-primary-600'
            }`}
            onPress={handleResolveAll}
            disabled={isResolving}
          >
            {isResolving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-center text-lg">
                Resolve & Sync
              </Text>
            )}
          </TouchableOpacity>
          <Text className="text-gray-500 dark:text-gray-400 text-xs text-center mt-2">
            Unselected conflicts will use server version
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
