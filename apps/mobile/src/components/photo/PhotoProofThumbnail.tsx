import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PhotoProofThumbnailProps {
  uri: string;
  size?: 'sm' | 'md' | 'lg';
  showFullscreenOnTap?: boolean;
  timestamp?: Date;
  verifiedBy?: string;
}

const SIZES = {
  sm: 48,
  md: 80,
  lg: 120,
};

export function PhotoProofThumbnail({
  uri,
  size = 'md',
  showFullscreenOnTap = true,
  timestamp,
  verifiedBy,
}: PhotoProofThumbnailProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const pixelSize = SIZES[size];
  const { width: screenWidth } = Dimensions.get('window');

  const handlePress = () => {
    if (showFullscreenOnTap) {
      setShowFullscreen(true);
    }
  };

  if (imageError) {
    return (
      <View
        className="bg-gray-200 rounded-xl items-center justify-center"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Text className="text-gray-400 text-xs">No image</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        className="rounded-xl overflow-hidden"
        style={{ width: pixelSize, height: pixelSize }}
        onPress={handlePress}
        disabled={!showFullscreenOnTap}
      >
        <Image
          source={{ uri }}
          className="w-full h-full"
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
        {/* Verified badge */}
        {verifiedBy && (
          <View className="absolute bottom-1 right-1 bg-success-500 rounded-full p-1">
            <Text className="text-white text-xs">✓</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Fullscreen Modal */}
      <Modal
        visible={showFullscreen}
        animationType="fade"
        transparent
        onRequestClose={() => setShowFullscreen(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-12 right-6 z-10 bg-black/50 rounded-full p-3"
            onPress={() => setShowFullscreen(false)}
          >
            <Text className="text-white text-xl">✕</Text>
          </TouchableOpacity>

          {/* Full Image */}
          <View className="flex-1 justify-center items-center p-4">
            <Image
              source={{ uri }}
              style={{ width: screenWidth - 32, height: screenWidth - 32 }}
              resizeMode="contain"
            />
          </View>

          {/* Info Footer */}
          <View className="p-6 bg-black/50">
            {timestamp && (
              <Text className="text-white/70 text-center">
                Taken on {timestamp.toLocaleDateString()} at{' '}
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            {verifiedBy && (
              <View className="flex-row items-center justify-center mt-2">
                <Text className="text-success-400">✓ Verified by {verifiedBy}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
