import * as ImagePicker from 'expo-image-picker';
import { Paths, File, Directory } from 'expo-file-system';
import { Platform, Alert, Linking } from 'react-native';

export interface PhotoResult {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  fileName: string;
  fileSize?: number;
}

export interface PhotoOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  includeBase64?: boolean;
}

const DEFAULT_OPTIONS: PhotoOptions = {
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
  includeBase64: false,
};

/**
 * Request camera permissions
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Camera Permission Required',
      'Please allow camera access to take photos for chore proof.',
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
    return false;
  }

  return true;
}

/**
 * Request photo library permissions
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    Alert.alert(
      'Photo Library Permission Required',
      'Please allow photo library access to select photos.',
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
    return false;
  }

  return true;
}

/**
 * Take a photo with the camera
 */
export async function takePhoto(options: PhotoOptions = {}): Promise<PhotoResult | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return null;
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: mergedOptions.allowsEditing,
      aspect: mergedOptions.aspect,
      quality: mergedOptions.quality,
      base64: mergedOptions.includeBase64,
      exif: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      base64: asset.base64 || undefined,
      fileName,
      fileSize: asset.fileSize,
    };
  } catch (error) {
    console.error('Failed to take photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
}

/**
 * Pick a photo from the library
 */
export async function pickPhoto(options: PhotoOptions = {}): Promise<PhotoResult | null> {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) {
    return null;
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: mergedOptions.allowsEditing,
      aspect: mergedOptions.aspect,
      quality: mergedOptions.quality,
      base64: mergedOptions.includeBase64,
      exif: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const fileName = asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;

    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      base64: asset.base64 || undefined,
      fileName,
      fileSize: asset.fileSize,
    };
  } catch (error) {
    console.error('Failed to pick photo:', error);
    Alert.alert('Error', 'Failed to select photo. Please try again.');
    return null;
  }
}

/**
 * Get the photo cache directory
 */
export function getPhotoCacheDirectory(): Directory {
  return new Directory(Paths.cache, 'photos');
}

/**
 * Save a photo to the cache directory
 */
export async function savePhotoToCache(
  sourceUri: string,
  fileName: string
): Promise<string | null> {
  try {
    const cacheDir = getPhotoCacheDirectory();

    // Create directory if it doesn't exist
    if (!cacheDir.exists) {
      cacheDir.create();
    }

    const sourceFile = new File(sourceUri);
    const destFile = new File(cacheDir, fileName);

    // Copy the file
    sourceFile.copy(destFile);

    return destFile.uri;
  } catch (error) {
    console.error('Failed to save photo to cache:', error);
    return null;
  }
}

/**
 * Delete a photo from cache
 */
export async function deletePhotoFromCache(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error('Failed to delete photo from cache:', error);
  }
}

/**
 * Clear all cached photos
 */
export async function clearPhotoCache(): Promise<void> {
  try {
    const cacheDir = getPhotoCacheDirectory();
    if (cacheDir.exists) {
      cacheDir.delete();
    }
  } catch (error) {
    console.error('Failed to clear photo cache:', error);
  }
}

/**
 * Get photo as base64 string (for upload)
 */
export async function getPhotoAsBase64(uri: string): Promise<string | null> {
  try {
    const file = new File(uri);
    if (!file.exists) {
      return null;
    }

    // For proper base64 encoding, we need to use arrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Failed to read photo as base64:', error);
    return null;
  }
}

/**
 * Get photo file info
 */
export function getPhotoInfo(
  uri: string
): { exists: boolean; size?: number } | null {
  try {
    const file = new File(uri);
    return {
      exists: file.exists,
      size: file.exists ? file.size : undefined,
    };
  } catch (error) {
    console.error('Failed to get photo info:', error);
    return null;
  }
}
