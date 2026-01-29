import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { takePhoto, pickPhoto, type PhotoResult } from '../../services/photo';

interface PhotoProofCaptureProps {
  onPhotoSelected: (photo: PhotoResult) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  required?: boolean;
}

export function PhotoProofCapture({
  onPhotoSelected,
  onCancel,
  title = 'Add Photo Proof',
  subtitle = 'Take a photo or choose from your library to prove completion',
  required = false,
}: PhotoProofCaptureProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoResult | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleTakePhoto = async () => {
    setIsCapturing(true);
    try {
      const photo = await takePhoto({
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (photo) {
        setSelectedPhoto(photo);
        setShowPreview(true);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickPhoto = async () => {
    setIsCapturing(true);
    try {
      const photo = await pickPhoto({
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (photo) {
        setSelectedPhoto(photo);
        setShowPreview(true);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConfirm = () => {
    if (selectedPhoto) {
      onPhotoSelected(selectedPhoto);
      setShowPreview(false);
    }
  };

  const handleRetake = () => {
    setSelectedPhoto(null);
    setShowPreview(false);
  };

  const handleSkip = () => {
    if (required) {
      Alert.alert(
        'Photo Required',
        'This chore requires photo proof to verify completion.',
        [{ text: 'OK' }]
      );
      return;
    }
    onCancel?.();
  };

  return (
    <View className="bg-white rounded-2xl p-6">
      {/* Header */}
      <View className="items-center mb-6">
        <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-4">
          <Text className="text-3xl">📸</Text>
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center">{title}</Text>
        <Text className="text-gray-500 text-center mt-2">{subtitle}</Text>
        {required && (
          <View className="bg-warning-50 px-3 py-1 rounded-full mt-2">
            <Text className="text-warning-700 text-sm font-medium">Required</Text>
          </View>
        )}
      </View>

      {/* Photo Options */}
      <View className="space-y-3">
        {/* Take Photo Button */}
        <TouchableOpacity
          className="bg-primary-500 rounded-xl py-4 flex-row items-center justify-center"
          onPress={handleTakePhoto}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text className="text-2xl mr-3">📷</Text>
              <Text className="text-white font-semibold text-lg">Take Photo</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Choose from Library Button */}
        <TouchableOpacity
          className="bg-gray-100 rounded-xl py-4 flex-row items-center justify-center mt-3"
          onPress={handlePickPhoto}
          disabled={isCapturing}
        >
          <Text className="text-2xl mr-3">🖼️</Text>
          <Text className="text-gray-700 font-semibold text-lg">Choose from Library</Text>
        </TouchableOpacity>

        {/* Skip Button (if not required) */}
        {!required && (
          <TouchableOpacity
            className="py-3 items-center mt-2"
            onPress={handleSkip}
            disabled={isCapturing}
          >
            <Text className="text-gray-500 font-medium">Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Photo Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPreview(false)}
      >
        <View className="flex-1 bg-black/90 justify-center">
          {/* Preview Image */}
          <View className="flex-1 justify-center items-center p-4">
            {selectedPhoto && (
              <Image
                source={{ uri: selectedPhoto.uri }}
                className="w-full aspect-[4/3] rounded-2xl"
                resizeMode="contain"
              />
            )}
          </View>

          {/* Preview Actions */}
          <View className="bg-white p-6 rounded-t-3xl">
            <Text className="text-xl font-bold text-gray-900 text-center mb-4">
              Preview Photo
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Does this photo clearly show the completed chore?
            </Text>

            <View className="flex-row space-x-3">
              {/* Retake Button */}
              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-xl py-4 items-center"
                onPress={handleRetake}
              >
                <Text className="text-gray-700 font-semibold">Retake</Text>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                className="flex-1 bg-success-500 rounded-xl py-4 items-center ml-3"
                onPress={handleConfirm}
              >
                <Text className="text-white font-semibold">Use Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
