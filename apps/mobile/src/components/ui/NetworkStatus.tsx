import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { useSyncStore } from '../../stores/sync-store';
import { useNetworkStatus } from '../../hooks/use-network-status';

export function NetworkStatusBanner() {
  const networkStatus = useNetworkStatus();
  const { isSyncing, pendingOperations, sync, syncError } = useSyncStore();

  // Update store with network status
  const { updateNetworkStatus } = useSyncStore();
  useEffect(() => {
    updateNetworkStatus(networkStatus);
  }, [networkStatus, updateNetworkStatus]);

  const slideAnim = useRef(new Animated.Value(-100)).current;

  const isOffline = !networkStatus.isConnected || networkStatus.isInternetReachable === false;
  const showBanner = isOffline || pendingOperations > 0 || syncError;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showBanner ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBanner, slideAnim]);

  if (!showBanner) {
    return null;
  }

  const getBannerStyle = () => {
    if (isOffline) return 'bg-warning-500';
    if (syncError) return 'bg-danger-500';
    if (pendingOperations > 0) return 'bg-primary-500';
    return 'bg-gray-500';
  };

  const getMessage = () => {
    if (isOffline) {
      return `Offline${pendingOperations > 0 ? ` - ${pendingOperations} pending` : ''}`;
    }
    if (isSyncing) {
      return 'Syncing...';
    }
    if (syncError) {
      return 'Sync error - tap to retry';
    }
    if (pendingOperations > 0) {
      return `${pendingOperations} changes waiting to sync`;
    }
    return '';
  };

  const handlePress = () => {
    if (!isOffline && !isSyncing) {
      sync();
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }] }}
      className={`absolute top-0 left-0 right-0 z-50 ${getBannerStyle()}`}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={isOffline || isSyncing}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center justify-center py-2 px-4">
          {isSyncing && (
            <View className="w-4 h-4 mr-2">
              <SyncSpinner />
            </View>
          )}
          <Text className="text-white text-sm font-medium">{getMessage()}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SyncSpinner() {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Text className="text-white text-sm">⟳</Text>
    </Animated.View>
  );
}

// Compact network indicator for header
export function NetworkStatusIndicator() {
  const networkStatus = useNetworkStatus();
  const { isSyncing, pendingOperations } = useSyncStore();

  const isOffline = !networkStatus.isConnected || networkStatus.isInternetReachable === false;

  if (!isOffline && !isSyncing && pendingOperations === 0) {
    return null;
  }

  return (
    <View className="flex-row items-center">
      {isOffline && (
        <View className="bg-warning-100 rounded-full px-2 py-1 flex-row items-center">
          <Text className="text-warning-700 text-xs font-medium">Offline</Text>
        </View>
      )}
      {!isOffline && isSyncing && (
        <View className="bg-primary-100 rounded-full px-2 py-1">
          <Text className="text-primary-700 text-xs font-medium">Syncing</Text>
        </View>
      )}
      {!isOffline && !isSyncing && pendingOperations > 0 && (
        <View className="bg-gray-100 rounded-full px-2 py-1">
          <Text className="text-gray-700 text-xs font-medium">{pendingOperations} pending</Text>
        </View>
      )}
    </View>
  );
}
