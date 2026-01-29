import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { TodayChore } from '@chorechamp/types';
import { PhotoProofCapture } from './PhotoProofCapture';
import { type PhotoResult, getPhotoAsBase64 } from '../../services/photo';

interface ChoreCompletionWithPhotoProps {
  visible: boolean;
  chore: TodayChore | null;
  householdPointsName?: string;
  onComplete: (photoUri?: string, photoBase64?: string) => Promise<void>;
  onCancel: () => void;
}

type Step = 'confirm' | 'photo' | 'submitting' | 'success';

export function ChoreCompletionWithPhoto({
  visible,
  chore,
  householdPointsName = 'points',
  onComplete,
  onCancel,
}: ChoreCompletionWithPhotoProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoResult | null>(null);

  const requiresPhoto = chore?.chore?.requiresPhoto ?? false;

  const handleConfirm = async () => {
    if (requiresPhoto) {
      setStep('photo');
    } else {
      await submitCompletion();
    }
  };

  const handlePhotoSelected = async (photo: PhotoResult) => {
    setSelectedPhoto(photo);
    await submitCompletion(photo);
  };

  const submitCompletion = async (photo?: PhotoResult) => {
    setStep('submitting');

    try {
      let base64: string | undefined;
      if (photo) {
        const photoBase64 = await getPhotoAsBase64(photo.uri);
        base64 = photoBase64 || undefined;
      }

      await onComplete(photo?.uri, base64);
      setStep('success');

      // Auto close after success animation
      setTimeout(() => {
        resetAndClose();
      }, 2000);
    } catch (error) {
      setStep(requiresPhoto ? 'photo' : 'confirm');
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to complete chore'
      );
    }
  };

  const resetAndClose = () => {
    setStep('confirm');
    setSelectedPhoto(null);
    onCancel();
  };

  const handleSkipPhoto = () => {
    submitCompletion();
  };

  if (!chore) return null;

  const choreTitle = chore.chore?.title || 'Chore';
  const chorePoints = chore.chore?.pointValue || 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={resetAndClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl">
          {/* Confirm Step */}
          {step === 'confirm' && (
            <View className="p-6">
              <View className="items-center mb-6">
                <View className="w-20 h-20 bg-success-100 rounded-full items-center justify-center mb-4">
                  <Text className="text-4xl">{chore.chore?.icon || '✓'}</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900 text-center">
                  Complete Chore?
                </Text>
                <Text className="text-gray-600 text-center mt-2 text-lg">
                  {choreTitle}
                </Text>
                <View className="bg-primary-50 px-4 py-2 rounded-full mt-4">
                  <Text className="text-primary-600 font-semibold">
                    +{chorePoints} {householdPointsName}
                  </Text>
                </View>
                {requiresPhoto && (
                  <View className="flex-row items-center mt-4 bg-warning-50 px-4 py-2 rounded-xl">
                    <Text className="text-warning-600 mr-2">📸</Text>
                    <Text className="text-warning-700 font-medium">
                      Photo proof required
                    </Text>
                  </View>
                )}
              </View>

              <View className="space-y-3">
                <TouchableOpacity
                  className="bg-success-500 rounded-xl py-4 items-center"
                  onPress={handleConfirm}
                >
                  <Text className="text-white font-semibold text-lg">
                    {requiresPhoto ? 'Continue to Photo' : 'Mark as Complete'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="py-3 items-center mt-3"
                  onPress={resetAndClose}
                >
                  <Text className="text-gray-500 font-medium">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Photo Step */}
          {step === 'photo' && (
            <View className="p-6">
              <PhotoProofCapture
                title="Add Photo Proof"
                subtitle={`Take a photo showing "${choreTitle}" is complete`}
                required={requiresPhoto}
                onPhotoSelected={handlePhotoSelected}
                onCancel={requiresPhoto ? undefined : handleSkipPhoto}
              />
            </View>
          )}

          {/* Submitting Step */}
          {step === 'submitting' && (
            <View className="p-6 py-12 items-center">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-gray-600 mt-4 text-lg">
                Completing chore...
              </Text>
              {selectedPhoto && (
                <View className="mt-4 rounded-xl overflow-hidden">
                  <Image
                    source={{ uri: selectedPhoto.uri }}
                    className="w-24 h-24"
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <View className="p-6 py-12 items-center">
              <View className="w-24 h-24 bg-success-100 rounded-full items-center justify-center mb-4">
                <Text className="text-5xl">🎉</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                Chore Complete!
              </Text>
              <View className="flex-row items-center mt-4">
                <Text className="text-success-600 font-semibold text-xl">
                  +{chorePoints} {householdPointsName}
                </Text>
              </View>
              {selectedPhoto && (
                <View className="flex-row items-center mt-3">
                  <Text className="text-gray-500 mr-2">📸</Text>
                  <Text className="text-gray-500">Photo proof added</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
