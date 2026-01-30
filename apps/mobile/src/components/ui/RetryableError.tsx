import React, { ReactElement } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface RetryableErrorProps {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  compact?: boolean;
  icon?: string;
}

export function RetryableError({
  message = 'Failed to load data',
  onRetry,
  isRetrying = false,
  compact = false,
  icon = '⚠️',
}: RetryableErrorProps): ReactElement {
  if (compact) {
    return (
      <View className="flex-row items-center justify-center p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl">
        <Text className="text-danger-600 dark:text-danger-400 mr-2">{message}</Text>
        <TouchableOpacity
          className="px-3 py-1 bg-danger-100 dark:bg-danger-800 rounded-lg"
          onPress={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Text className="text-danger-700 dark:text-danger-300 font-medium">Retry</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="items-center justify-center p-6">
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm items-center max-w-sm w-full">
        <Text className="text-4xl mb-4">{icon}</Text>
        <Text className="text-gray-900 dark:text-white font-semibold text-center mb-2">
          {message}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center text-sm mb-4">
          Check your connection and try again
        </Text>
        <TouchableOpacity
          className="bg-primary-500 dark:bg-primary-600 rounded-xl py-3 px-8"
          onPress={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white font-semibold">Retry</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  icon = '📭',
  actionLabel,
  onAction,
}: EmptyStateProps): ReactElement {
  return (
    <View className="items-center justify-center p-6">
      <Text className="text-5xl mb-4">{icon}</Text>
      <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
        {title}
      </Text>
      {message && (
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          className="bg-primary-500 dark:bg-primary-600 rounded-xl py-3 px-6"
          onPress={onAction}
        >
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface OfflineNoticeProps {
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function OfflineNotice({ onRetry, isRetrying = false }: OfflineNoticeProps): ReactElement {
  return (
    <View className="bg-warning-100 dark:bg-warning-900/30 rounded-xl p-4 mx-4 my-2">
      <View className="flex-row items-center">
        <Text className="text-2xl mr-3">📡</Text>
        <View className="flex-1">
          <Text className="text-warning-800 dark:text-warning-200 font-semibold">
            {"You're offline"}
          </Text>
          <Text className="text-warning-700 dark:text-warning-300 text-sm">
            Some features may not be available
          </Text>
        </View>
        {onRetry && (
          <TouchableOpacity
            className="bg-warning-200 dark:bg-warning-800 rounded-lg px-3 py-2"
            onPress={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#b45309" />
            ) : (
              <Text className="text-warning-800 dark:text-warning-200 font-medium">Retry</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
