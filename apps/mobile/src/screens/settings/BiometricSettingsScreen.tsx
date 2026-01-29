import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  getBiometricInfo,
  getBiometricTypeName,
  getBiometricIcon,
  isBiometricEnabled,
  setBiometricEnabled,
  authenticate,
  getSecurityLevel,
  type BiometricInfo,
} from '../../services/biometric';
import { useFeedback } from '../../hooks/use-feedback';
import { Button } from '../../components/ui';

export function BiometricSettingsScreen() {
  const navigation = useNavigation();
  const feedback = useFeedback();

  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<{
    level: 'high' | 'medium' | 'low';
    description: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    const [info, isEnabled, security] = await Promise.all([
      getBiometricInfo(),
      isBiometricEnabled(),
      getSecurityLevel(),
    ]);
    setBiometricInfo(info);
    setEnabled(isEnabled);
    setSecurityLevel(security);
    setIsLoading(false);
  };

  const handleToggle = async (value: boolean) => {
    const success = await setBiometricEnabled(value);
    if (success) {
      setEnabled(value);
      await feedback.success();
      // Refresh security level
      const security = await getSecurityLevel();
      setSecurityLevel(security);
    } else {
      await feedback.error();
    }
  };

  const handleTestBiometric = async () => {
    await feedback.buttonPress();

    if (!biometricInfo?.isAvailable) {
      Alert.alert(
        'Not Available',
        'Biometric authentication is not available on this device.'
      );
      return;
    }

    const typeName = getBiometricTypeName(biometricInfo.primaryType);
    const result = await authenticate(`Test ${typeName}`);

    if (result.success) {
      await feedback.success();
      Alert.alert('Success!', `${typeName} authentication successful.`);
    } else {
      await feedback.error();
      Alert.alert('Failed', result.error || 'Authentication failed.');
    }
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const SecurityBadge = () => {
    if (!securityLevel) return null;

    const colors = {
      high: { bg: 'bg-success-100', text: 'text-success-700' },
      medium: { bg: 'bg-warning-100', text: 'text-warning-700' },
      low: { bg: 'bg-danger-100', text: 'text-danger-700' },
    };

    const icons = {
      high: '🔒',
      medium: '🔓',
      low: '⚠️',
    };

    return (
      <View className={`${colors[securityLevel.level].bg} p-4 rounded-xl`}>
        <View className="flex-row items-center mb-2">
          <Text className="text-xl mr-2">{icons[securityLevel.level]}</Text>
          <Text className={`${colors[securityLevel.level].text} font-semibold capitalize`}>
            {securityLevel.level} Security
          </Text>
        </View>
        <Text className={`${colors[securityLevel.level].text} text-sm`}>
          {securityLevel.description}
        </Text>
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

  const typeName = biometricInfo?.primaryType
    ? getBiometricTypeName(biometricInfo.primaryType)
    : 'Biometric';
  const typeIcon = biometricInfo?.primaryType
    ? getBiometricIcon(biometricInfo.primaryType)
    : '🔒';

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
            Biometric Security
          </Text>
          <Text className="text-gray-500 mt-1">
            Protect your account with {typeName.toLowerCase()}
          </Text>
        </View>

        {/* Security Level */}
        <View className="mx-6 mt-4">
          <SecurityBadge />
        </View>

        {/* Biometric Info */}
        <View className="bg-white mx-6 mt-4 rounded-2xl p-6">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mr-4">
              <Text className="text-3xl">{typeIcon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">{typeName}</Text>
              <Text className="text-gray-500">
                {biometricInfo?.isAvailable
                  ? 'Available on this device'
                  : 'Not available'}
              </Text>
            </View>
          </View>

          {biometricInfo?.isAvailable ? (
            <View className="border-t border-gray-100 pt-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-900 font-medium">
                    Enable {typeName}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Require {typeName.toLowerCase()} to unlock the app
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={handleToggle}
                  trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          ) : (
            <View className="border-t border-gray-100 pt-4">
              <Text className="text-gray-600 mb-3">
                {biometricInfo?.isEnrolled
                  ? `${typeName} is not enrolled on this device.`
                  : `This device doesn't support ${typeName.toLowerCase()}.`}
              </Text>
              <Button
                title="Open Device Settings"
                onPress={handleOpenSettings}
                variant="secondary"
                size="sm"
              />
            </View>
          )}
        </View>

        {/* Test Button */}
        {biometricInfo?.isAvailable && (
          <View className="bg-white mx-6 mt-4 rounded-2xl p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Test Authentication
            </Text>
            <Text className="text-gray-500 mb-4">
              Verify that {typeName.toLowerCase()} is working correctly.
            </Text>
            <Button
              title={`Test ${typeName}`}
              onPress={handleTestBiometric}
              variant="primary"
              size="md"
            />
          </View>
        )}

        {/* Supported Types */}
        {biometricInfo && biometricInfo.supportedTypes.length > 0 && (
          <View className="bg-white mx-6 mt-4 rounded-2xl p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Supported Authentication
            </Text>
            <View className="space-y-3">
              {biometricInfo.supportedTypes.map((type) => (
                <View
                  key={type}
                  className="flex-row items-center bg-gray-50 p-3 rounded-xl"
                >
                  <Text className="text-xl mr-3">{getBiometricIcon(type)}</Text>
                  <Text className="text-gray-700 font-medium">
                    {getBiometricTypeName(type)}
                  </Text>
                  {type === biometricInfo.primaryType && (
                    <View className="ml-auto bg-primary-100 px-2 py-1 rounded-full">
                      <Text className="text-primary-600 text-xs font-medium">
                        Primary
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info */}
        <View className="mx-6 mt-4 p-4 bg-gray-100 rounded-xl mb-6">
          <Text className="text-gray-600 text-sm">
            💡 When enabled, {typeName.toLowerCase()} will be required to unlock
            the app. Your biometric data never leaves your device and is
            processed securely by {Platform.OS === 'ios' ? 'iOS' : 'Android'}.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
