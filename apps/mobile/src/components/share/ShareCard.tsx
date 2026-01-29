import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  shareAchievement,
  shareStreakMilestone,
  sharePointsMilestone,
  shareApp,
} from '../../services/sharing';
import { useFeedback } from '../../hooks/use-feedback';

export type ShareType = 'achievement' | 'streak' | 'points' | 'app';

interface ShareCardProps {
  type: ShareType;
  data?: {
    achievementName?: string;
    achievementDescription?: string;
    memberName?: string;
    streakDays?: number;
    points?: number;
    pointsName?: string;
  };
  onShare?: (success: boolean) => void;
}

export function ShareCard({ type, data = {}, onShare }: ShareCardProps) {
  const feedback = useFeedback();

  const handleShare = async () => {
    await feedback.buttonPress();

    let result;

    switch (type) {
      case 'achievement':
        if (data.achievementName && data.memberName) {
          result = await shareAchievement(
            data.achievementName,
            data.achievementDescription || '',
            data.memberName
          );
        }
        break;

      case 'streak':
        if (data.streakDays && data.memberName) {
          result = await shareStreakMilestone(data.streakDays, data.memberName);
        }
        break;

      case 'points':
        if (data.points && data.memberName) {
          result = await sharePointsMilestone(
            data.points,
            data.memberName,
            data.pointsName
          );
        }
        break;

      case 'app':
        result = await shareApp();
        break;
    }

    if (result?.success) {
      await feedback.success();
      onShare?.(true);
    } else {
      onShare?.(false);
    }
  };

  const getCardContent = () => {
    switch (type) {
      case 'achievement':
        return {
          icon: '🏆',
          title: data.achievementName || 'Achievement',
          subtitle: data.achievementDescription || 'Share this achievement',
          buttonText: 'Share Achievement',
          bgColor: 'bg-warning-50',
          iconBg: 'bg-warning-100',
        };

      case 'streak':
        return {
          icon: '🔥',
          title: `${data.streakDays || 0}-Day Streak`,
          subtitle: 'Share your streak milestone',
          buttonText: 'Share Streak',
          bgColor: 'bg-orange-50',
          iconBg: 'bg-orange-100',
        };

      case 'points':
        return {
          icon: '💰',
          title: `${(data.points || 0).toLocaleString()} ${data.pointsName || 'Points'}`,
          subtitle: 'Share your points milestone',
          buttonText: 'Share Points',
          bgColor: 'bg-primary-50',
          iconBg: 'bg-primary-100',
        };

      case 'app':
        return {
          icon: '📱',
          title: 'ChoreChamp',
          subtitle: 'Share the app with friends and family',
          buttonText: 'Share App',
          bgColor: 'bg-success-50',
          iconBg: 'bg-success-100',
        };

      default:
        return {
          icon: '📤',
          title: 'Share',
          subtitle: 'Share with others',
          buttonText: 'Share',
          bgColor: 'bg-gray-50',
          iconBg: 'bg-gray-100',
        };
    }
  };

  const content = getCardContent();

  return (
    <View className={`${content.bgColor} rounded-2xl p-4`}>
      <View className="flex-row items-center">
        <View className={`${content.iconBg} w-12 h-12 rounded-full items-center justify-center`}>
          <Text className="text-2xl">{content.icon}</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-gray-900 font-semibold">{content.title}</Text>
          <Text className="text-gray-600 text-sm">{content.subtitle}</Text>
        </View>
        <TouchableOpacity
          className="bg-white px-4 py-2 rounded-full"
          onPress={handleShare}
        >
          <Text className="text-primary-600 font-medium text-sm">Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Quick share button component
 */
interface QuickShareButtonProps {
  type: ShareType;
  data?: ShareCardProps['data'];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function QuickShareButton({
  type,
  data,
  size = 'md',
  showLabel = false,
}: QuickShareButtonProps) {
  const feedback = useFeedback();

  const handleShare = async () => {
    await feedback.buttonPress();

    let result;

    switch (type) {
      case 'achievement':
        if (data?.achievementName && data?.memberName) {
          result = await shareAchievement(
            data.achievementName,
            data.achievementDescription || '',
            data.memberName
          );
        }
        break;

      case 'streak':
        if (data?.streakDays && data?.memberName) {
          result = await shareStreakMilestone(data.streakDays, data.memberName);
        }
        break;

      case 'points':
        if (data?.points && data?.memberName) {
          result = await sharePointsMilestone(
            data.points,
            data.memberName,
            data.pointsName
          );
        }
        break;

      case 'app':
        result = await shareApp();
        break;
    }

    if (result?.success) {
      await feedback.success();
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <TouchableOpacity
      className={`${sizeClasses[size]} bg-gray-100 rounded-full items-center justify-center`}
      onPress={handleShare}
    >
      <Text className={iconSizes[size]}>📤</Text>
      {showLabel && (
        <Text className="text-gray-600 text-xs mt-1">Share</Text>
      )}
    </TouchableOpacity>
  );
}
