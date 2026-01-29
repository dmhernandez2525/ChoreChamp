import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  getWidgetConfig,
  updateWidgetConfig,
  getWidgetSetupInstructions,
  areWidgetsSupported,
  type WidgetConfig,
  DEFAULT_WIDGET_CONFIG,
} from '../../services/widgets';
import { Button } from '../../components/ui';

const REFRESH_INTERVAL_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
];

export function WidgetSettingsScreen() {
  const navigation = useNavigation();
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    const savedConfig = await getWidgetConfig();
    setConfig(savedConfig);
    setIsLoading(false);
  };

  const handleToggle = async (key: keyof WidgetConfig, value: boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    await updateWidgetConfig({ [key]: value });
  };

  const handleIntervalChange = async (interval: number) => {
    setConfig({ ...config, refreshInterval: interval });
    await updateWidgetConfig({ refreshInterval: interval });
    setShowIntervalPicker(false);
  };

  const handleShowInstructions = () => {
    Alert.alert(
      'Widget Setup',
      getWidgetSetupInstructions(),
      [{ text: 'OK' }]
    );
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

  const getIntervalLabel = () => {
    const option = REFRESH_INTERVAL_OPTIONS.find(o => o.value === config.refreshInterval);
    return option?.label || `${config.refreshInterval} minutes`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

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
          <Text className="text-2xl font-bold text-gray-900">Home Screen Widget</Text>
          <Text className="text-gray-500 mt-1">
            Configure how the widget displays your chore data
          </Text>
        </View>

        {/* Platform Info */}
        <View className="mx-6 mt-4 p-4 bg-primary-50 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Text className="text-xl mr-2">{Platform.OS === 'ios' ? '📱' : '🤖'}</Text>
            <Text className="text-primary-700 font-semibold">
              {Platform.OS === 'ios' ? 'iOS Widget' : 'Android Widget'}
            </Text>
          </View>
          <Text className="text-primary-600 text-sm mb-3">
            {areWidgetsSupported()
              ? 'Add the ChoreChamp widget to your home screen for quick access to your daily chores.'
              : 'Widgets are not available on this device.'}
          </Text>
          <Button
            title="Setup Instructions"
            onPress={handleShowInstructions}
            size="sm"
            variant="ghost"
          />
        </View>

        {/* Widget Preview */}
        <View className="mx-6 mt-4 p-6 bg-white rounded-2xl">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Widget Preview
          </Text>
          <View className="bg-gray-100 rounded-xl p-4">
            {/* Mock widget preview */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">📋</Text>
                <Text className="text-gray-900 font-semibold">ChoreChamp</Text>
              </View>
              {config.showStreak && (
                <View className="flex-row items-center bg-warning-100 px-2 py-1 rounded-full">
                  <Text className="text-sm">🔥</Text>
                  <Text className="text-warning-700 font-medium text-sm ml-1">5</Text>
                </View>
              )}
            </View>

            {config.showNextChore && (
              <View className="bg-white rounded-lg p-3 mb-2">
                <Text className="text-gray-600 text-xs uppercase mb-1">Next Up</Text>
                <View className="flex-row items-center">
                  <Text className="text-lg mr-2">🧹</Text>
                  <Text className="text-gray-900 font-medium">Vacuum living room</Text>
                </View>
              </View>
            )}

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-16 h-2 bg-gray-300 rounded-full overflow-hidden">
                  <View className="w-2/3 h-full bg-success-500 rounded-full" />
                </View>
                <Text className="text-gray-600 text-sm ml-2">2/3</Text>
              </View>
              {config.showPoints && (
                <Text className="text-primary-600 font-semibold">150 pts</Text>
              )}
            </View>
          </View>
        </View>

        {/* Display Settings */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <View className="px-6 pt-6 pb-2">
            <Text className="text-lg font-semibold text-gray-900">
              Display Options
            </Text>
          </View>
          <SettingRow
            title="Show next chore"
            subtitle="Display the upcoming chore on the widget"
            value={config.showNextChore}
            onToggle={(value) => handleToggle('showNextChore', value)}
          />
          <SettingRow
            title="Show streak"
            subtitle="Display your current streak count"
            value={config.showStreak}
            onToggle={(value) => handleToggle('showStreak', value)}
          />
          <SettingRow
            title="Show points"
            subtitle="Display your current points balance"
            value={config.showPoints}
            onToggle={(value) => handleToggle('showPoints', value)}
          />
        </View>

        {/* Refresh Settings */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <View className="px-6 pt-6 pb-2">
            <Text className="text-lg font-semibold text-gray-900">
              Refresh Settings
            </Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center justify-between px-6 py-4 border-t border-gray-100"
            onPress={() => setShowIntervalPicker(true)}
          >
            <View>
              <Text className="text-gray-900 font-medium">Refresh interval</Text>
              <Text className="text-gray-500 text-sm mt-1">
                How often the widget updates
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-500 mr-2">{getIntervalLabel()}</Text>
              <Text className="text-gray-400">›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer space */}
        <View className="h-8" />
      </ScrollView>

      {/* Interval Picker */}
      {showIntervalPicker && (
        <View className="absolute inset-0 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl">
            <View className="p-6 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900 text-center">
                Refresh Interval
              </Text>
            </View>
            <ScrollView className="max-h-80">
              {REFRESH_INTERVAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={`px-6 py-4 border-b border-gray-100 flex-row items-center justify-between ${
                    option.value === config.refreshInterval ? 'bg-primary-50' : ''
                  }`}
                  onPress={() => handleIntervalChange(option.value)}
                >
                  <Text
                    className={`font-medium ${
                      option.value === config.refreshInterval
                        ? 'text-primary-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {option.label}
                  </Text>
                  {option.value === config.refreshInterval && (
                    <Text className="text-primary-500 text-xl">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="p-6">
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowIntervalPicker(false)}
                size="lg"
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
