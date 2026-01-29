import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  areHapticsEnabled,
  setHapticsEnabled,
  triggerHaptic,
} from '../../services/haptics';
import {
  areSoundsEnabled,
  setSoundsEnabled,
  getSoundVolume,
  setSoundVolume,
} from '../../services/sounds';
import { useFeedback } from '../../hooks/use-feedback';
import { Button } from '../../components/ui';

export function SoundsAndHapticsScreen() {
  const navigation = useNavigation();
  const feedback = useFeedback();

  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [soundsEnabled, setSoundsEnabledState] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const [haptics, sounds, vol] = await Promise.all([
      areHapticsEnabled(),
      areSoundsEnabled(),
      getSoundVolume(),
    ]);
    setHapticsEnabledState(haptics);
    setSoundsEnabledState(sounds);
    setVolume(vol);
    setIsLoading(false);
  };

  const handleHapticsToggle = async (value: boolean) => {
    setHapticsEnabledState(value);
    await setHapticsEnabled(value);
    if (value) {
      // Give immediate feedback that haptics are enabled
      await triggerHaptic('success');
    }
  };

  const handleSoundsToggle = async (value: boolean) => {
    setSoundsEnabledState(value);
    await setSoundsEnabled(value);
  };

  const handleVolumeChange = async (value: number) => {
    setVolume(value);
    await setSoundVolume(value);
  };

  const testHaptic = async (type: string) => {
    switch (type) {
      case 'light':
        await triggerHaptic('light');
        break;
      case 'medium':
        await triggerHaptic('medium');
        break;
      case 'heavy':
        await triggerHaptic('heavy');
        break;
      case 'success':
        await triggerHaptic('success');
        break;
      case 'warning':
        await triggerHaptic('warning');
        break;
      case 'error':
        await triggerHaptic('error');
        break;
    }
  };

  const testFeedback = async (type: string) => {
    switch (type) {
      case 'choreComplete':
        await feedback.choreComplete();
        break;
      case 'rewardRedeemed':
        await feedback.rewardRedeemed();
        break;
      case 'error':
        await feedback.error();
        break;
    }
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
          <Text className="text-2xl font-bold text-gray-900">
            Sounds & Haptics
          </Text>
          <Text className="text-gray-500 mt-1">
            Customize audio and tactile feedback
          </Text>
        </View>

        {/* Haptics Section */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <View className="px-6 pt-6 pb-2">
            <Text className="text-lg font-semibold text-gray-900">Haptics</Text>
            <Text className="text-gray-500 text-sm mt-1">
              Tactile feedback when interacting with the app
            </Text>
          </View>
          <SettingRow
            title="Enable Haptics"
            subtitle={Platform.OS === 'ios' ? 'Taptic Engine feedback' : 'Vibration feedback'}
            value={hapticsEnabled}
            onToggle={handleHapticsToggle}
          />
        </View>

        {/* Haptic Test Buttons */}
        {hapticsEnabled && (
          <View className="bg-white mx-6 mt-4 rounded-2xl p-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Test Haptic Patterns
            </Text>
            <View className="flex-row flex-wrap">
              {['light', 'medium', 'heavy', 'success', 'warning', 'error'].map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    className="bg-gray-100 rounded-lg px-4 py-2 mr-2 mb-2"
                    onPress={() => testHaptic(type)}
                  >
                    <Text className="text-gray-700 text-sm capitalize">{type}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        )}

        {/* Sounds Section */}
        <View className="bg-white mx-6 mt-4 rounded-2xl overflow-hidden">
          <View className="px-6 pt-6 pb-2">
            <Text className="text-lg font-semibold text-gray-900">Sounds</Text>
            <Text className="text-gray-500 text-sm mt-1">
              Audio feedback for actions and events
            </Text>
          </View>
          <SettingRow
            title="Enable Sounds"
            subtitle="Play sound effects for interactions"
            value={soundsEnabled}
            onToggle={handleSoundsToggle}
          />
        </View>

        {/* Volume Slider */}
        {soundsEnabled && (
          <View className="bg-white mx-6 mt-4 rounded-2xl p-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 font-medium">Volume</Text>
              <Text className="text-gray-500">{Math.round(volume * 100)}%</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-lg mr-2">🔈</Text>
              <Slider
                style={{ flex: 1, height: 40 }}
                minimumValue={0}
                maximumValue={1}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor="#6366f1"
                maximumTrackTintColor="#e5e7eb"
                thumbTintColor="#6366f1"
              />
              <Text className="text-lg ml-2">🔊</Text>
            </View>
          </View>
        )}

        {/* Combined Feedback Test */}
        <View className="bg-white mx-6 mt-4 rounded-2xl p-6">
          <Text className="text-lg font-semibold text-gray-900 mb-2">
            Test Feedback
          </Text>
          <Text className="text-gray-500 text-sm mb-4">
            Test combined haptic and sound feedback
          </Text>
          <View className="space-y-3">
            <Button
              title="🎉 Chore Complete"
              onPress={() => testFeedback('choreComplete')}
              variant="primary"
              size="md"
            />
            <Button
              title="🎁 Reward Redeemed"
              onPress={() => testFeedback('rewardRedeemed')}
              variant="secondary"
              size="md"
            />
            <Button
              title="❌ Error"
              onPress={() => testFeedback('error')}
              variant="danger"
              size="md"
            />
          </View>
        </View>

        {/* Info */}
        <View className="mx-6 mt-4 p-4 bg-gray-100 rounded-xl">
          <Text className="text-gray-600 text-sm">
            💡 Haptics provide tactile feedback when you complete chores, redeem
            rewards, or interact with buttons. Sounds add audio cues for important
            events.
          </Text>
        </View>

        {/* Footer space */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
