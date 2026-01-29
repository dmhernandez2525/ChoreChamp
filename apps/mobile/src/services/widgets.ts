import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';

// Widget data types
export interface ChoreWidgetData {
  todayTotal: number;
  todayCompleted: number;
  nextChore: {
    id: string;
    title: string;
    icon: string;
    dueTime: string | null;
    pointValue: number;
  } | null;
  pointsBalance: number;
  currentStreak: number;
  lastUpdated: string;
}

export interface WidgetConfig {
  refreshInterval: number; // minutes
  showNextChore: boolean;
  showStreak: boolean;
  showPoints: boolean;
}

// Storage keys for widget data
// These would be accessed by native widget code via App Groups (iOS) or SharedPreferences (Android)
const WIDGET_DATA_KEY = 'chorechamp_widget_data';
const WIDGET_CONFIG_KEY = 'chorechamp_widget_config';
const BACKGROUND_FETCH_TASK = 'CHORECHAMP_WIDGET_UPDATE';

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  refreshInterval: 15,
  showNextChore: true,
  showStreak: true,
  showPoints: true,
};

/**
 * Get the current widget data
 */
export async function getWidgetData(): Promise<ChoreWidgetData | null> {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get widget data:', error);
    return null;
  }
}

/**
 * Update widget data - called when chore data changes
 */
export async function updateWidgetData(data: ChoreWidgetData): Promise<void> {
  try {
    const dataWithTimestamp = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(dataWithTimestamp));

    // On iOS, we would also need to update App Group storage
    // On Android, we would trigger widget update via native bridge
    if (Platform.OS === 'ios') {
      await notifyIOSWidgetUpdate();
    } else {
      await notifyAndroidWidgetUpdate();
    }
  } catch (error) {
    console.error('Failed to update widget data:', error);
  }
}

/**
 * Get widget configuration
 */
export async function getWidgetConfig(): Promise<WidgetConfig> {
  try {
    const config = await AsyncStorage.getItem(WIDGET_CONFIG_KEY);
    return config ? { ...DEFAULT_WIDGET_CONFIG, ...JSON.parse(config) } : DEFAULT_WIDGET_CONFIG;
  } catch (error) {
    console.error('Failed to get widget config:', error);
    return DEFAULT_WIDGET_CONFIG;
  }
}

/**
 * Update widget configuration
 */
export async function updateWidgetConfig(config: Partial<WidgetConfig>): Promise<void> {
  try {
    const currentConfig = await getWidgetConfig();
    const newConfig = { ...currentConfig, ...config };
    await AsyncStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(newConfig));

    // Re-register background fetch with new interval if needed
    if (config.refreshInterval !== undefined) {
      await registerWidgetBackgroundTask(config.refreshInterval);
    }
  } catch (error) {
    console.error('Failed to update widget config:', error);
  }
}

/**
 * Prepare widget data from app state
 */
export function prepareWidgetData(
  todayChores: { id: string; chore: { title: string; icon?: string; pointValue: number; dueTime?: string | null } | null; isCompleted: boolean }[],
  pointsBalance: number,
  currentStreak: number
): ChoreWidgetData {
  const todayTotal = todayChores.length;
  const todayCompleted = todayChores.filter(c => c.isCompleted).length;

  // Find the next incomplete chore
  const nextIncomplete = todayChores.find(c => !c.isCompleted);
  const nextChore = nextIncomplete && nextIncomplete.chore ? {
    id: nextIncomplete.id,
    title: nextIncomplete.chore.title,
    icon: nextIncomplete.chore.icon || '📋',
    dueTime: nextIncomplete.chore.dueTime || null,
    pointValue: nextIncomplete.chore.pointValue,
  } : null;

  return {
    todayTotal,
    todayCompleted,
    nextChore,
    pointsBalance,
    currentStreak,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Register background task for widget updates
 */
export async function registerWidgetBackgroundTask(intervalMinutes: number = 15): Promise<void> {
  try {
    // Define the task
    TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
      try {
        // This task would fetch latest data and update widget storage
        // The actual data fetching would be done here
        console.log('Widget background fetch executed');
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Widget background fetch failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register the background fetch task
    const status = await BackgroundFetch.getStatusAsync();

    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: intervalMinutes * 60, // Convert to seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Widget background task registered');
    } else {
      console.log('Background fetch not available:', status);
    }
  } catch (error) {
    console.error('Failed to register widget background task:', error);
  }
}

/**
 * Unregister background task
 */
export async function unregisterWidgetBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('Widget background task unregistered');
    }
  } catch (error) {
    console.error('Failed to unregister widget background task:', error);
  }
}

/**
 * iOS widget update notification
 * In a real implementation, this would use App Groups and WidgetCenter.reloadAllTimelines()
 */
async function notifyIOSWidgetUpdate(): Promise<void> {
  // This would use a native module to call WidgetCenter.shared.reloadAllTimelines()
  // For now, we just log that it would happen
  console.log('iOS widget update would be triggered here');

  // Example native module call (would be implemented in native code):
  // await NativeModules.WidgetBridge?.reloadWidgets();
}

/**
 * Android widget update notification
 * In a real implementation, this would trigger widget update via AppWidgetManager
 */
async function notifyAndroidWidgetUpdate(): Promise<void> {
  // This would use a native module to send broadcast to AppWidgetManager
  // For now, we just log that it would happen
  console.log('Android widget update would be triggered here');

  // Example native module call (would be implemented in native code):
  // await NativeModules.WidgetBridge?.updateWidgets();
}

/**
 * Check if widgets are supported on this device
 */
export function areWidgetsSupported(): boolean {
  // Widgets require:
  // - iOS 14+ for WidgetKit
  // - Android 4.0+ for App Widgets (virtually all devices)
  // In a managed Expo app, widgets require ejecting to bare workflow
  // This function returns whether the platform supports widgets conceptually
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Get instructions for setting up widgets based on platform
 */
export function getWidgetSetupInstructions(): string {
  if (Platform.OS === 'ios') {
    return `
iOS Widget Setup:
1. Open the app settings from the Widget Gallery
2. Add the ChoreChamp widget to your Home Screen
3. Long press to customize widget size

Widget Sizes Available:
- Small: Shows next chore and progress
- Medium: Shows today's chores list
- Large: Shows full day overview with stats
    `.trim();
  }

  return `
Android Widget Setup:
1. Long press on your Home Screen
2. Select "Widgets"
3. Find "ChoreChamp" in the widget list
4. Drag the widget to your Home Screen
5. Resize as needed

Widget Sizes Available:
- 2x1: Shows next chore
- 2x2: Shows progress and next chore
- 4x2: Shows today's chores list
  `.trim();
}
