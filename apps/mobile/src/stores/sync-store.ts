import { create } from 'zustand';
import { AppState, AppStateStatus } from 'react-native';
import { performFullSync, type SyncResult } from '../sync/sync-engine';
import { checkNetworkStatus, type NetworkStatus } from '../hooks/use-network-status';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  lastSyncResult: SyncResult | null;
  pendingOperations: number;
  networkStatus: NetworkStatus;
  syncError: string | null;
}

interface SyncActions {
  sync: () => Promise<SyncResult>;
  updateNetworkStatus: (status: NetworkStatus) => void;
  setPendingOperations: (count: number) => void;
  clearSyncError: () => void;
}

type SyncStore = SyncState & SyncActions;

export const useSyncStore = create<SyncStore>((set, get) => ({
  isSyncing: false,
  lastSyncAt: null,
  lastSyncResult: null,
  pendingOperations: 0,
  networkStatus: {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  },
  syncError: null,

  sync: async () => {
    const { isSyncing, networkStatus } = get();

    // Don't sync if already syncing
    if (isSyncing) {
      return {
        success: false,
        tablesSync: [],
        errors: ['Sync already in progress'],
        offlineQueueProcessed: 0,
      };
    }

    // Don't sync if offline
    if (!networkStatus.isConnected) {
      return {
        success: false,
        tablesSync: [],
        errors: ['No network connection'],
        offlineQueueProcessed: 0,
      };
    }

    set({ isSyncing: true, syncError: null });

    try {
      const result = await performFullSync();

      set({
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        lastSyncResult: result,
        syncError: result.errors.length > 0 ? result.errors.join('; ') : null,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      set({
        isSyncing: false,
        syncError: errorMessage,
      });

      return {
        success: false,
        tablesSync: [],
        errors: [errorMessage],
        offlineQueueProcessed: 0,
      };
    }
  },

  updateNetworkStatus: (status: NetworkStatus) => {
    const { networkStatus: prevStatus, sync } = get();

    set({ networkStatus: status });

    // Auto-sync when coming back online
    if (!prevStatus.isConnected && status.isConnected && status.isInternetReachable) {
      // Delay slightly to ensure connection is stable
      setTimeout(() => {
        sync();
      }, 1000);
    }
  },

  setPendingOperations: (count: number) => {
    set({ pendingOperations: count });
  },

  clearSyncError: () => {
    set({ syncError: null });
  },
}));

// App state change handler for sync triggers
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

export function setupSyncTriggers(): () => void {
  const { sync, updateNetworkStatus } = useSyncStore.getState();

  // Handle app state changes (background/foreground)
  appStateSubscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      // App came to foreground - check network and sync
      const status = await checkNetworkStatus();
      updateNetworkStatus(status);

      if (status.isConnected && status.isInternetReachable) {
        sync();
      }
    }
  });

  // Initial network check
  checkNetworkStatus().then(updateNetworkStatus);

  // Return cleanup function
  return () => {
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }
  };
}
