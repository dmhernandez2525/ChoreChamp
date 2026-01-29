import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useNotificationStore } from '../../stores/notification-store';
import { Button } from '../../components/ui';

const REMINDER_TIME_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

const DAILY_SUMMARY_TIME_OPTIONS = [
  { label: '7:00 AM', value: '07:00' },
  { label: '8:00 AM', value: '08:00' },
  { label: '9:00 AM', value: '09:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '8:00 PM', value: '20:00' },
];

export function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const {
    permissionGranted,
    permissionChecked,
    settings,
    isLoading,
    requestPermissions,
    updateSettings,
    initialize,
  } = useNotificationStore();

  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [showSummaryTimePicker, setShowSummaryTimePicker] = useState(false);

  useEffect(() => {
    if (!permissionChecked) {
      initialize();
    }
  }, [permissionChecked, initialize]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
  };

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    if (key === 'enabled' && value && !permissionGranted) {
      await handleEnableNotifications();
      return;
    }
    await updateSettings({ [key]: value });
  };

  const SettingRow = ({
    title,
    subtitle,
    value,
    onToggle,
    disabled = false,
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View
      className={`flex-row items-center justify-between px-6 py-4 border-b border-gray-100 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <View className="flex-1 mr-4">
        <Text className="text-gray-900 font-medium">{title}</Text>
        {subtitle && (
          <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
        thumbColor="#ffffff"
      />
    </View>
  );

  const OptionRow = ({
    title,
    value,
    onPress,
    disabled = false,
  }: {
    title: string;
    value: string;
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-6 py-4 border-b border-gray-100 ${
        disabled ? 'opacity-50' : ''
      }`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className="text-gray-900 font-medium">{title}</Text>
      <View className="flex-row items-center">
        <Text className="text-gray-500 mr-2">{value}</Text>
        <Text className="text-gray-400">›</Text>
      </View>
    </TouchableOpacity>
  );

  const PickerModal = ({
    visible,
    title,
    options,
    selectedValue,
    onSelect,
    onClose,
  }: {
    visible: boolean;
    title: string;
    options: { label: string; value: string | number }[];
    selectedValue: string | number;
    onSelect: (value: string | number) => void;
    onClose: () => void;
  }) => {
    if (!visible) return null;

    return (
      <View className="absolute inset-0 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl">
          <View className="p-6 border-b border-gray-100">
            <Text className="text-xl font-bold text-gray-900 text-center">
              {title}
            </Text>
          </View>
          <ScrollView className="max-h-80">
            {options.map((option) => (
              <TouchableOpacity
                key={String(option.value)}
                className={`px-6 py-4 border-b border-gray-100 flex-row items-center justify-between ${
                  option.value === selectedValue ? 'bg-primary-50' : ''
                }`}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text
                  className={`font-medium ${
                    option.value === selectedValue
                      ? 'text-primary-600'
                      : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
                {option.value === selectedValue && (
                  <Text className="text-primary-500 text-xl">✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View className="p-6">
            <Button title="Cancel" variant="ghost" onPress={onClose} size="lg" />
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  const getReminderTimeLabel = () => {
    const option = REMINDER_TIME_OPTIONS.find(
      (o) => o.value === settings.choreReminderTime
    );
    return option?.label || `${settings.choreReminderTime} minutes`;
  };

  const getSummaryTimeLabel = () => {
    const option = DAILY_SUMMARY_TIME_OPTIONS.find(
      (o) => o.value === settings.dailySummaryTime
    );
    return option?.label || settings.dailySummaryTime;
  };

  const notificationsDisabled = !settings.enabled || !permissionGranted;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-primary-500 text-lg">‹ Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
          <Text className="text-gray-500 mt-1">
            Manage how and when you receive notifications
          </Text>
        </View>

        {/* Permission Warning */}
        {permissionChecked && !permissionGranted && (
          <View className="mx-6 mt-4 p-4 bg-warning-50 rounded-xl">
            <View className="flex-row items-center mb-2">
              <Text className="text-xl mr-2">⚠️</Text>
              <Text className="text-warning-700 font-semibold">
                Notifications Disabled
              </Text>
            </View>
            <Text className="text-warning-600 text-sm mb-3">
              Enable notifications to receive reminders for your chores and
              important updates.
            </Text>
            <Button
              title="Enable Notifications"
              onPress={handleEnableNotifications}
              size="sm"
            />
          </View>
        )}

        {/* Master Toggle */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <SettingRow
            title="Enable Notifications"
            subtitle="Turn all notifications on or off"
            value={settings.enabled && permissionGranted}
            onToggle={(value) => handleToggle('enabled', value)}
          />
        </View>

        {/* Chore Reminders */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <View className="px-6 pt-6 pb-2">
            <Text className="text-lg font-semibold text-gray-900">
              Chore Reminders
            </Text>
          </View>
          <SettingRow
            title="Reminder before due time"
            subtitle="Get notified before a chore is due"
            value={settings.choreReminders}
            onToggle={(value) => handleToggle('choreReminders', value)}
            disabled={notificationsDisabled}
          />
          <OptionRow
            title="Reminder time"
            value={getReminderTimeLabel()}
            onPress={() => setShowReminderTimePicker(true)}
            disabled={notificationsDisabled || !settings.choreReminders}
          />
        </View>

        {/* Daily Summary */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <View className="px-6 pt-6 pb-2">
            <Text className="text-lg font-semibold text-gray-900">
              Daily Summary
            </Text>
          </View>
          <SettingRow
            title="Daily overview"
            subtitle="Get a summary of your tasks each day"
            value={settings.dailySummary}
            onToggle={(value) => handleToggle('dailySummary', value)}
            disabled={notificationsDisabled}
          />
          <OptionRow
            title="Summary time"
            value={getSummaryTimeLabel()}
            onPress={() => setShowSummaryTimePicker(true)}
            disabled={notificationsDisabled || !settings.dailySummary}
          />
        </View>

        {/* Other Notifications */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <View className="px-6 pt-6 pb-2">
            <Text className="text-lg font-semibold text-gray-900">
              Other Notifications
            </Text>
          </View>
          <SettingRow
            title="Streak reminders"
            subtitle="Reminder to complete chores to maintain your streak"
            value={settings.streakReminders}
            onToggle={(value) => handleToggle('streakReminders', value)}
            disabled={notificationsDisabled}
          />
          <SettingRow
            title="Reward updates"
            subtitle="Notifications about new rewards and redemptions"
            value={settings.rewardUpdates}
            onToggle={(value) => handleToggle('rewardUpdates', value)}
            disabled={notificationsDisabled}
          />
          <SettingRow
            title="Family activity"
            subtitle="See when family members complete chores"
            value={settings.familyActivity}
            onToggle={(value) => handleToggle('familyActivity', value)}
            disabled={notificationsDisabled}
          />
        </View>

        {/* Footer space */}
        <View className="h-8" />
      </ScrollView>

      {/* Pickers */}
      <PickerModal
        visible={showReminderTimePicker}
        title="Reminder Time"
        options={REMINDER_TIME_OPTIONS}
        selectedValue={settings.choreReminderTime}
        onSelect={(value) =>
          updateSettings({ choreReminderTime: value as number })
        }
        onClose={() => setShowReminderTimePicker(false)}
      />

      <PickerModal
        visible={showSummaryTimePicker}
        title="Summary Time"
        options={DAILY_SUMMARY_TIME_OPTIONS}
        selectedValue={settings.dailySummaryTime}
        onSelect={(value) =>
          updateSettings({ dailySummaryTime: value as string })
        }
        onClose={() => setShowSummaryTimePicker(false)}
      />
    </SafeAreaView>
  );
}
