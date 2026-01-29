import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const BIOMETRIC_ENABLED_KEY = 'chorechamp_biometric_enabled';

// Cache for settings
let biometricEnabledCache: boolean | null = null;

/**
 * Biometric authentication types
 */
export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricInfo {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
  primaryType: BiometricType;
}

/**
 * Check if biometric authentication is available on this device
 */
export async function getBiometricInfo(): Promise<BiometricInfo> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const types: BiometricType[] = supportedTypes.map((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'facial';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'iris';
        default:
          return 'none';
      }
    }).filter((t): t is BiometricType => t !== 'none');

    // Determine primary type
    let primaryType: BiometricType = 'none';
    if (types.includes('facial')) {
      primaryType = 'facial';
    } else if (types.includes('fingerprint')) {
      primaryType = 'fingerprint';
    } else if (types.includes('iris')) {
      primaryType = 'iris';
    }

    return {
      isAvailable: hasHardware && isEnrolled,
      isEnrolled,
      supportedTypes: types,
      primaryType,
    };
  } catch (error) {
    console.error('Failed to get biometric info:', error);
    return {
      isAvailable: false,
      isEnrolled: false,
      supportedTypes: [],
      primaryType: 'none',
    };
  }
}

/**
 * Get a human-readable name for the biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case 'facial':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Scanner';
    default:
      return 'Biometric';
  }
}

/**
 * Get the icon for the biometric type
 */
export function getBiometricIcon(type: BiometricType): string {
  switch (type) {
    case 'facial':
      return '👤';
    case 'fingerprint':
      return '👆';
    case 'iris':
      return '👁️';
    default:
      return '🔒';
  }
}

/**
 * Check if biometric unlock is enabled by user preference
 */
export async function isBiometricEnabled(): Promise<boolean> {
  if (biometricEnabledCache !== null) {
    return biometricEnabledCache;
  }

  try {
    const stored = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    biometricEnabledCache = stored === 'true';
    return biometricEnabledCache;
  } catch {
    return false;
  }
}

/**
 * Enable or disable biometric unlock
 */
export async function setBiometricEnabled(enabled: boolean): Promise<boolean> {
  try {
    // If enabling, verify biometrics work first
    if (enabled) {
      const info = await getBiometricInfo();
      if (!info.isAvailable) {
        Alert.alert(
          'Biometric Not Available',
          'Please set up biometric authentication in your device settings first.'
        );
        return false;
      }

      // Test authentication
      const result = await authenticate('Verify to enable biometric unlock');
      if (!result.success) {
        return false;
      }
    }

    biometricEnabledCache = enabled;
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error('Failed to set biometric enabled:', error);
    return false;
  }
}

/**
 * Authentication result
 */
export interface AuthenticationResult {
  success: boolean;
  error?: string;
  warning?: string;
}

/**
 * Authenticate using biometrics
 */
export async function authenticate(
  promptMessage?: string,
  options?: {
    fallbackLabel?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }
): Promise<AuthenticationResult> {
  try {
    const info = await getBiometricInfo();

    if (!info.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication not available',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to continue',
      fallbackLabel: options?.fallbackLabel || 'Use Passcode',
      cancelLabel: options?.cancelLabel || 'Cancel',
      disableDeviceFallback: options?.disableDeviceFallback ?? false,
    });

    if (result.success) {
      return { success: true };
    }

    // Handle specific error cases
    if (result.error === 'user_cancel') {
      return {
        success: false,
        error: 'Authentication cancelled',
      };
    }

    if (result.error === 'user_fallback') {
      return {
        success: false,
        error: 'User chose passcode fallback',
      };
    }

    if (result.error === 'lockout') {
      return {
        success: false,
        error: 'Too many failed attempts. Please try again later.',
      };
    }

    return {
      success: false,
      error: result.error || 'Authentication failed',
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Authenticate for app unlock
 */
export async function authenticateForAppUnlock(): Promise<AuthenticationResult> {
  const enabled = await isBiometricEnabled();
  if (!enabled) {
    return { success: true }; // Skip if not enabled
  }

  const info = await getBiometricInfo();
  const typeName = getBiometricTypeName(info.primaryType);

  return authenticate(`Unlock ChoreChamp with ${typeName}`, {
    fallbackLabel: 'Use Passcode',
    cancelLabel: 'Cancel',
  });
}

/**
 * Authenticate for sensitive action (like viewing rewards or signing out)
 */
export async function authenticateForSensitiveAction(
  actionDescription: string
): Promise<AuthenticationResult> {
  const enabled = await isBiometricEnabled();
  if (!enabled) {
    return { success: true }; // Skip if not enabled
  }

  return authenticate(actionDescription, {
    disableDeviceFallback: true,
  });
}

/**
 * Get security level description
 */
export async function getSecurityLevel(): Promise<{
  level: 'high' | 'medium' | 'low';
  description: string;
}> {
  const info = await getBiometricInfo();
  const enabled = await isBiometricEnabled();

  if (!info.isAvailable) {
    return {
      level: 'low',
      description: 'No biometric protection available',
    };
  }

  if (!enabled) {
    return {
      level: 'medium',
      description: 'Biometric protection available but not enabled',
    };
  }

  return {
    level: 'high',
    description: `Protected with ${getBiometricTypeName(info.primaryType)}`,
  };
}
