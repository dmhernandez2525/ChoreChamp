import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { Badge } from '@chorechamp/types';
import { getStreakBonus, getBadgeBonus } from '@chorechamp/gamification';

type MilestoneType = 'streak' | 'badge' | 'level' | 'chores';

interface MilestoneAlertProps {
  visible: boolean;
  type: MilestoneType;
  data: {
    streak?: number;
    badge?: Badge;
    level?: number;
    choresCount?: number;
    bonusPoints?: number;
  };
  onClose: () => void;
}

const MILESTONE_CONFIG: Record<MilestoneType, { emoji: string; title: string; bgColor: string }> = {
  streak: { emoji: '🔥', title: 'Streak Milestone!', bgColor: '#FEF3C7' },
  badge: { emoji: '🏆', title: 'Badge Earned!', bgColor: '#DBEAFE' },
  level: { emoji: '⬆️', title: 'Level Up!', bgColor: '#D1FAE5' },
  chores: { emoji: '🎯', title: 'Milestone Reached!', bgColor: '#EDE9FE' },
};

export function MilestoneAlert({ visible, type, data, onClose }: MilestoneAlertProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-15);
  const iconScale = useSharedValue(0);

  const config = MILESTONE_CONFIG[type];

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate modal in
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      rotate.value = withSequence(
        withTiming(-15, { duration: 0 }),
        withTiming(15, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );

      // Animate icon
      iconScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.3, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 150 })
      );
    } else {
      scale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const getContent = () => {
    switch (type) {
      case 'streak':
        const streakBonus = data.streak ? getStreakBonus(data.streak) : 0;
        return {
          subtitle: `${data.streak} Day Streak!`,
          description: streakBonus > 0
            ? `Amazing dedication! You earned ${streakBonus} bonus points!`
            : 'Keep up the great work!',
          bonus: streakBonus,
        };

      case 'badge':
        const badgeBonus = data.badge ? getBadgeBonus(data.badge.rarity) : 0;
        return {
          subtitle: data.badge?.name || 'New Badge',
          description: data.badge?.description || 'You unlocked a new achievement!',
          bonus: badgeBonus,
          extra: data.badge?.icon,
        };

      case 'level':
        return {
          subtitle: `Level ${data.level}`,
          description: 'You reached a new level! Keep going!',
          bonus: data.bonusPoints || 0,
        };

      case 'chores':
        return {
          subtitle: `${data.choresCount} Chores!`,
          description: `You've completed ${data.choresCount} chores in total!`,
          bonus: data.bonusPoints || 0,
        };

      default:
        return { subtitle: '', description: '', bonus: 0 };
    }
  };

  const content = getContent();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60">
        <Animated.View style={containerStyle}>
          <View
            className="mx-8 rounded-3xl p-6 items-center shadow-lg"
            style={{ backgroundColor: config.bgColor }}
          >
            {/* Icon */}
            <Animated.View
              style={iconStyle}
              className="w-24 h-24 rounded-full bg-white items-center justify-center shadow-md mb-4"
            >
              <Text className="text-5xl">{content.extra || config.emoji}</Text>
            </Animated.View>

            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {config.title}
            </Text>

            {/* Subtitle */}
            <Text className="text-xl font-semibold text-gray-700 mb-2">
              {content.subtitle}
            </Text>

            {/* Description */}
            <Text className="text-gray-600 text-center mb-4">
              {content.description}
            </Text>

            {/* Bonus points */}
            {content.bonus > 0 && (
              <View className="bg-white rounded-xl px-6 py-3 mb-4">
                <Text className="text-success-600 font-bold text-xl">
                  +{content.bonus} points!
                </Text>
              </View>
            )}

            {/* Close button */}
            <TouchableOpacity
              className="bg-white rounded-xl px-8 py-3 shadow-sm"
              onPress={onClose}
            >
              <Text className="text-gray-700 font-semibold text-lg">Awesome!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
