import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Haptic feedback types for different actions
export type HapticFeedbackType =
  | 'light'      // Light tap - for selections, toggles
  | 'medium'     // Medium tap - for button presses
  | 'heavy'      // Heavy tap - for confirmations
  | 'success'    // Success pattern - for completions
  | 'warning'    // Warning pattern - for alerts
  | 'error'      // Error pattern - for failures
  | 'selection'; // Selection feedback - for list items

// Storage key for haptics settings
const HAPTICS_ENABLED_KEY = 'chorechamp_haptics_enabled';

// Cache for the setting to avoid async lookups on every call
let hapticsEnabledCache: boolean | null = null;

/**
 * Check if haptics are enabled
 */
export async function areHapticsEnabled(): Promise<boolean> {
  if (hapticsEnabledCache !== null) {
    return hapticsEnabledCache;
  }

  try {
    const stored = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
    hapticsEnabledCache = stored !== 'false'; // Default to true
    return hapticsEnabledCache;
  } catch {
    return true; // Default to enabled
  }
}

/**
 * Set haptics enabled/disabled
 */
export async function setHapticsEnabled(enabled: boolean): Promise<void> {
  try {
    hapticsEnabledCache = enabled;
    await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Failed to save haptics setting:', error);
  }
}

/**
 * Trigger haptic feedback
 */
export async function triggerHaptic(type: HapticFeedbackType): Promise<void> {
  // Haptics only work on iOS and Android (not web)
  if (Platform.OS === 'web') {
    return;
  }

  const enabled = await areHapticsEnabled();
  if (!enabled) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;

      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;

      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;

      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;

      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;

      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;

      case 'selection':
        await Haptics.selectionAsync();
        break;
    }
  } catch (error) {
    console.error('Haptic feedback failed:', error);
  }
}

/**
 * Pre-defined haptic patterns for specific app actions
 */
export const AppHaptics = {
  // Button press
  buttonPress: () => triggerHaptic('medium'),

  // Tab/toggle selection
  selection: () => triggerHaptic('selection'),

  // Chore completed
  choreComplete: () => triggerHaptic('success'),

  // Reward redeemed
  rewardRedeemed: () => triggerHaptic('success'),

  // Error occurred
  error: () => triggerHaptic('error'),

  // Warning/alert
  warning: () => triggerHaptic('warning'),

  // Light tap for subtle interactions
  lightTap: () => triggerHaptic('light'),

  // Heavy tap for significant actions
  heavyTap: () => triggerHaptic('heavy'),

  // Swipe action completed
  swipeAction: () => triggerHaptic('medium'),

  // Pull to refresh triggered
  pullRefresh: () => triggerHaptic('light'),

  // Modal opened
  modalOpen: () => triggerHaptic('light'),

  // Modal closed
  modalClose: () => triggerHaptic('light'),
};

/**
 * Trigger a custom pattern of haptics
 */
export async function triggerHapticPattern(
  pattern: HapticFeedbackType[],
  delayMs: number = 100
): Promise<void> {
  for (let i = 0; i < pattern.length; i++) {
    await triggerHaptic(pattern[i]);
    if (i < pattern.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}
