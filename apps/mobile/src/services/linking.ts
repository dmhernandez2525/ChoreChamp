import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// URL scheme for the app
export const URL_SCHEME = 'chorechamp';
export const WEB_URL = 'https://chorechamp.app'; // Replace with actual domain

/**
 * Deep link paths and their corresponding screens
 */
export const DEEP_LINK_PATHS = {
  // Main tabs
  home: 'home',
  chores: 'chores',
  rewards: 'rewards',
  profile: 'profile',

  // Specific screens
  choreDetail: 'chore/:choreId',
  rewardDetail: 'reward/:rewardId',
  achievement: 'achievement/:achievementId',
  invite: 'invite/:code',
  household: 'household/:householdId',

  // Settings
  settings: 'settings',
  notifications: 'settings/notifications',
  widgets: 'settings/widgets',
  sounds: 'settings/sounds',
} as const;

/**
 * Get the linking configuration for React Navigation
 */
export function getLinkingConfig() {
  return {
    prefixes: [
      Linking.createURL('/'),
      `${URL_SCHEME}://`,
      WEB_URL,
    ],
    config: {
      screens: {
        Main: {
          screens: {
            Home: DEEP_LINK_PATHS.home,
            Chores: DEEP_LINK_PATHS.chores,
            Rewards: DEEP_LINK_PATHS.rewards,
            Profile: DEEP_LINK_PATHS.profile,
          },
        },
        NotificationSettings: DEEP_LINK_PATHS.notifications,
        WidgetSettings: DEEP_LINK_PATHS.widgets,
        SoundsAndHaptics: DEEP_LINK_PATHS.sounds,
        // Add more screen mappings as needed
      },
    },
  };
}

/**
 * Generate a deep link URL
 */
export function createDeepLink(path: string, params?: Record<string, string>): string {
  let url = `${URL_SCHEME}://${path}`;

  if (params) {
    // Replace path params
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });

    // Add remaining params as query string
    const remainingParams = Object.entries(params).filter(
      ([key]) => !url.includes(key)
    );
    if (remainingParams.length > 0) {
      const queryString = remainingParams
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      url += `?${queryString}`;
    }
  }

  return url;
}

/**
 * Generate a web link URL (for sharing)
 */
export function createWebLink(path: string, params?: Record<string, string>): string {
  let url = `${WEB_URL}/${path}`;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }

  return url;
}

/**
 * Parse a deep link URL
 */
export function parseDeepLink(url: string): { path: string; params: Record<string, string> } | null {
  try {
    const parsed = Linking.parse(url);
    return {
      path: parsed.path || '',
      params: (parsed.queryParams || {}) as Record<string, string>,
    };
  } catch {
    return null;
  }
}

/**
 * Create an invite link
 */
export function createInviteLink(inviteCode: string): string {
  return createWebLink(`invite/${inviteCode}`);
}

/**
 * Create a household join link
 */
export function createHouseholdJoinLink(householdId: string, inviteCode: string): string {
  return createWebLink('join', { household: householdId, code: inviteCode });
}

/**
 * Create a share link for achievement
 */
export function createAchievementShareLink(achievementId: string, memberId: string): string {
  return createWebLink(`achievement/${achievementId}`, { member: memberId });
}

/**
 * Check if the app can handle a URL
 */
export async function canHandleUrl(url: string): Promise<boolean> {
  try {
    const parsed = Linking.parse(url);
    const prefixes = [URL_SCHEME, WEB_URL];
    return prefixes.some(prefix => url.startsWith(prefix) || (parsed.scheme === URL_SCHEME));
  } catch {
    return false;
  }
}

/**
 * Open a URL (either in-app or external)
 */
export async function openUrl(url: string): Promise<boolean> {
  try {
    const canHandle = await canHandleUrl(url);
    if (canHandle) {
      // Let the app handle it
      await Linking.openURL(url);
      return true;
    }

    // Open externally
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get the initial URL that launched the app
 */
export async function getInitialUrl(): Promise<string | null> {
  return Linking.getInitialURL();
}

/**
 * Subscribe to URL events
 */
export function subscribeToUrlEvents(
  callback: (url: string) => void
): { remove: () => void } {
  const subscription = Linking.addEventListener('url', (event) => {
    callback(event.url);
  });

  return {
    remove: () => subscription.remove(),
  };
}

/**
 * Generate universal link for cross-platform sharing
 */
export function getUniversalLink(path: string, params?: Record<string, string>): string {
  // On iOS, prefer universal links (web URLs that open the app)
  // On Android, prefer app links
  // For sharing, always use web URLs that can work even without the app installed
  return createWebLink(path, params);
}

/**
 * Get platform-specific app store link
 */
export function getAppStoreLink(): string {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/app/chorechamp/id123456789'; // Replace with actual App Store ID
  }
  return 'https://play.google.com/store/apps/details?id=com.chorechamp.app'; // Replace with actual package name
}
