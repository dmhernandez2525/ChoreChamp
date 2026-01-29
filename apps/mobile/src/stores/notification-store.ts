import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import {
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  requestNotificationPermissions,
  getPushToken,
  getNotificationSettings,
  saveNotificationSettings,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../services/notifications';

interface NotificationState {
  // Permission status
  permissionGranted: boolean;
  permissionChecked: boolean;

  // Push token
  pushToken: string | null;

  // Settings
  settings: NotificationSettings;

  // Current notification
  lastNotification: Notifications.Notification | null;

  // Loading
  isLoading: boolean;
}

interface NotificationActions {
  // Initialize
  initialize: () => Promise<void>;

  // Permissions
  requestPermissions: () => Promise<boolean>;
  checkPermissions: () => Promise<boolean>;

  // Settings
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Token
  refreshPushToken: () => Promise<void>;

  // Handlers
  handleNotificationReceived: (notification: Notifications.Notification) => void;
  handleNotificationResponse: (response: Notifications.NotificationResponse) => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  permissionGranted: false,
  permissionChecked: false,
  pushToken: null,
  settings: DEFAULT_NOTIFICATION_SETTINGS,
  lastNotification: null,
  isLoading: false,

  initialize: async () => {
    try {
      set({ isLoading: true });

      // Check permissions
      const { status } = await Notifications.getPermissionsAsync();
      const permissionGranted = status === 'granted';
      set({ permissionGranted, permissionChecked: true });

      // Load settings
      const settings = await getNotificationSettings();
      set({ settings });

      // Get push token if permissions granted
      if (permissionGranted) {
        const pushToken = await getPushToken();
        set({ pushToken });
      }

      // Set up listeners
      addNotificationReceivedListener(get().handleNotificationReceived);
      addNotificationResponseListener(get().handleNotificationResponse);

      set({ isLoading: false });
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      set({ isLoading: false });
    }
  },

  requestPermissions: async () => {
    const granted = await requestNotificationPermissions();
    set({ permissionGranted: granted, permissionChecked: true });

    if (granted) {
      const pushToken = await getPushToken();
      set({ pushToken });
    }

    return granted;
  },

  checkPermissions: async () => {
    const { status } = await Notifications.getPermissionsAsync();
    const permissionGranted = status === 'granted';
    set({ permissionGranted, permissionChecked: true });
    return permissionGranted;
  },

  updateSettings: async (newSettings: Partial<NotificationSettings>) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, ...newSettings };

    await saveNotificationSettings(updatedSettings);
    set({ settings: updatedSettings });

    // If notifications were just enabled, ensure we have permissions
    if (newSettings.enabled && !currentSettings.enabled) {
      const { permissionGranted } = get();
      if (!permissionGranted) {
        await get().requestPermissions();
      }
    }
  },

  resetSettings: async () => {
    await saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
    set({ settings: DEFAULT_NOTIFICATION_SETTINGS });
  },

  refreshPushToken: async () => {
    const { permissionGranted } = get();
    if (permissionGranted) {
      const pushToken = await getPushToken();
      set({ pushToken });
    }
  },

  handleNotificationReceived: (notification: Notifications.Notification) => {
    set({ lastNotification: notification });

    // Log notification for debugging
    console.log('Notification received:', notification.request.content);
  },

  handleNotificationResponse: (response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const data = notification.request.content.data;

    // Handle different notification types based on data
    switch (data?.type) {
      case 'chore-reminder':
        console.log('Chore reminder tapped, choreId:', data.choreId);
        // Navigation will be handled by the app component
        break;

      case 'daily-summary':
        console.log('Daily summary tapped');
        break;

      case 'streak-reminder':
        console.log('Streak reminder tapped');
        break;

      case 'reward-redemption':
        console.log('Reward notification tapped');
        break;

      case 'family-activity':
        console.log('Family activity notification tapped');
        break;

      default:
        console.log('Unknown notification type:', data?.type);
    }
  },
}));
