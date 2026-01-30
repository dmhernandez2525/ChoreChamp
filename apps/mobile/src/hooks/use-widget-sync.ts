import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useHouseholdStore } from '../stores/household-store';
import {
  updateWidgetData,
  prepareWidgetData,
  registerWidgetBackgroundTask,
  getWidgetConfig,
} from '../services/widgets';

/**
 * Hook to sync widget data with app state
 * Should be used at the top level of the app to keep widgets updated
 */
export function useWidgetSync() {
  const {
    todayChores,
    activeMember,
  } = useHouseholdStore();

  const syncWidgetData = useCallback(async () => {
    if (!activeMember) return;

    try {
      const widgetData = prepareWidgetData(
        todayChores,
        activeMember.pointsCurrent,
        activeMember.streakCurrent
      );

      await updateWidgetData(widgetData);
    } catch (error) {
      console.error('Failed to sync widget data:', error);
    }
  }, [todayChores, activeMember]);

  // Sync when app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        syncWidgetData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [syncWidgetData]);

  // Sync when chore data changes
  useEffect(() => {
    syncWidgetData();
  }, [syncWidgetData]);

  // Register background task on mount
  useEffect(() => {
    const setup = async () => {
      const config = await getWidgetConfig();
      await registerWidgetBackgroundTask(config.refreshInterval);
    };

    setup();
  }, []);

  return { syncWidgetData };
}
