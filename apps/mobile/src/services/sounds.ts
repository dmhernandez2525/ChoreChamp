import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sound effect types
export type SoundEffect =
  | 'complete'     // Chore completed
  | 'reward'       // Reward redeemed
  | 'points'       // Points earned
  | 'levelUp'      // Level up/badge earned
  | 'streak'       // Streak achieved
  | 'tap'          // Button tap
  | 'success'      // Generic success
  | 'error'        // Error/failure
  | 'notification' // Notification received
  | 'swoosh';      // Navigation transition

// Storage keys
const SOUNDS_ENABLED_KEY = 'chorechamp_sounds_enabled';
const SOUNDS_VOLUME_KEY = 'chorechamp_sounds_volume';

// Cache for settings
let soundsEnabledCache: boolean | null = null;
let soundsVolumeCache: number | null = null;

// Sound instance cache (to avoid loading the same sound multiple times)
const soundCache: Map<SoundEffect, Audio.Sound> = new Map();

/**
 * Initialize audio mode
 */
export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false, // Respect silent mode
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
}

/**
 * Check if sounds are enabled
 */
export async function areSoundsEnabled(): Promise<boolean> {
  if (soundsEnabledCache !== null) {
    return soundsEnabledCache;
  }

  try {
    const stored = await AsyncStorage.getItem(SOUNDS_ENABLED_KEY);
    soundsEnabledCache = stored !== 'false'; // Default to true
    return soundsEnabledCache;
  } catch {
    return true;
  }
}

/**
 * Set sounds enabled/disabled
 */
export async function setSoundsEnabled(enabled: boolean): Promise<void> {
  try {
    soundsEnabledCache = enabled;
    await AsyncStorage.setItem(SOUNDS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Failed to save sounds setting:', error);
  }
}

/**
 * Get sound volume (0.0 to 1.0)
 */
export async function getSoundVolume(): Promise<number> {
  if (soundsVolumeCache !== null) {
    return soundsVolumeCache;
  }

  try {
    const stored = await AsyncStorage.getItem(SOUNDS_VOLUME_KEY);
    soundsVolumeCache = stored ? parseFloat(stored) : 0.7; // Default 70%
    return soundsVolumeCache;
  } catch {
    return 0.7;
  }
}

/**
 * Set sound volume
 */
export async function setSoundVolume(volume: number): Promise<void> {
  try {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    soundsVolumeCache = clampedVolume;
    await AsyncStorage.setItem(SOUNDS_VOLUME_KEY, clampedVolume.toString());
  } catch (error) {
    console.error('Failed to save volume setting:', error);
  }
}

/**
 * Get the sound source for an effect
 * Note: In a real app, these would be actual audio files
 * For now, we'll use placeholder sounds
 */
function getSoundSource(_effect: SoundEffect): number | null {
  // In production, you would import actual sound files like:
  // return require('../../assets/sounds/complete.mp3');

  // For now, we return null to indicate no sound file available
  // You would replace these with actual asset requires
  return null;

  // Example of what this would look like with real assets:
  // switch (effect) {
  //   case 'complete':
  //     return require('../../assets/sounds/complete.mp3');
  //   case 'reward':
  //     return require('../../assets/sounds/reward.mp3');
  //   case 'points':
  //     return require('../../assets/sounds/points.mp3');
  //   case 'levelUp':
  //     return require('../../assets/sounds/level-up.mp3');
  //   case 'streak':
  //     return require('../../assets/sounds/streak.mp3');
  //   case 'tap':
  //     return require('../../assets/sounds/tap.mp3');
  //   case 'success':
  //     return require('../../assets/sounds/success.mp3');
  //   case 'error':
  //     return require('../../assets/sounds/error.mp3');
  //   case 'notification':
  //     return require('../../assets/sounds/notification.mp3');
  //   case 'swoosh':
  //     return require('../../assets/sounds/swoosh.mp3');
  //   default:
  //     return null;
  // }
}

/**
 * Play a sound effect
 */
export async function playSound(effect: SoundEffect): Promise<void> {
  const enabled = await areSoundsEnabled();
  if (!enabled) {
    return;
  }

  try {
    const source = getSoundSource(effect);
    if (!source) {
      // No sound file available for this effect
      return;
    }

    const volume = await getSoundVolume();

    // Check if sound is already cached
    let sound = soundCache.get(effect);

    if (!sound) {
      // Load the sound
      const { sound: newSound } = await Audio.Sound.createAsync(source);
      sound = newSound;
      soundCache.set(effect, sound);
    }

    // Set volume and play
    await sound.setVolumeAsync(volume);
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (error) {
    console.error('Failed to play sound:', error);
  }
}

/**
 * Pre-defined sounds for specific app actions
 */
export const AppSounds = {
  // Chore completed
  choreComplete: () => playSound('complete'),

  // Reward redeemed
  rewardRedeemed: () => playSound('reward'),

  // Points earned
  pointsEarned: () => playSound('points'),

  // Level up or badge earned
  levelUp: () => playSound('levelUp'),

  // Streak achieved
  streakAchieved: () => playSound('streak'),

  // Button tap
  tap: () => playSound('tap'),

  // Success feedback
  success: () => playSound('success'),

  // Error feedback
  error: () => playSound('error'),

  // Notification
  notification: () => playSound('notification'),

  // Navigation transition
  transition: () => playSound('swoosh'),
};

/**
 * Unload all cached sounds
 */
export async function unloadAllSounds(): Promise<void> {
  try {
    for (const sound of soundCache.values()) {
      await sound.unloadAsync();
    }
    soundCache.clear();
  } catch (error) {
    console.error('Failed to unload sounds:', error);
  }
}
