import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Badge, BadgeRarity } from '@chorechamp/types';

interface BadgeCardProps {
  badge: Badge;
  isEarned: boolean;
  progress?: number; // 0-1
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const RARITY_COLORS: Record<BadgeRarity, { bg: string; border: string; text: string }> = {
  common: { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' },
  rare: { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' },
  epic: { bg: '#EDE9FE', border: '#8B5CF6', text: '#6D28D9' },
  legendary: { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309' },
};

const RARITY_GLOW: Record<BadgeRarity, string> = {
  common: '',
  rare: 'shadow-blue-200',
  epic: 'shadow-purple-200',
  legendary: 'shadow-yellow-200',
};

export function BadgeCard({
  badge,
  isEarned,
  progress = 0,
  onPress,
  size = 'medium',
}: BadgeCardProps) {
  const colors = RARITY_COLORS[badge.rarity];
  const glowClass = isEarned ? RARITY_GLOW[badge.rarity] : '';

  const sizeClasses = {
    small: { container: 'w-16 h-16', icon: 'text-2xl', nameSize: 'text-xs' },
    medium: { container: 'w-24 h-24', icon: 'text-4xl', nameSize: 'text-sm' },
    large: { container: 'w-32 h-32', icon: 'text-5xl', nameSize: 'text-base' },
  };

  const sizeConfig = sizeClasses[size];

  return (
    <TouchableOpacity
      className={`items-center`}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        className={`${sizeConfig.container} rounded-2xl items-center justify-center ${glowClass}`}
        style={{
          backgroundColor: isEarned ? colors.bg : '#F9FAFB',
          borderWidth: 2,
          borderColor: isEarned ? colors.border : '#E5E7EB',
          opacity: isEarned ? 1 : 0.5,
        }}
      >
        <Text className={sizeConfig.icon} style={{ opacity: isEarned ? 1 : 0.4 }}>
          {badge.icon}
        </Text>

        {/* Progress indicator for unearned badges */}
        {!isEarned && progress > 0 && (
          <View className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
        )}

        {/* Rarity indicator */}
        {isEarned && badge.rarity !== 'common' && (
          <View
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.border }}
          >
            <Text className="text-white text-xs">
              {badge.rarity === 'rare' ? '★' : badge.rarity === 'epic' ? '★★' : '★★★'}
            </Text>
          </View>
        )}
      </View>

      <Text
        className={`${sizeConfig.nameSize} font-medium text-center mt-1`}
        style={{ color: isEarned ? colors.text : '#9CA3AF' }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </TouchableOpacity>
  );
}

interface BadgeGridProps {
  badges: Badge[];
  earnedBadgeIds: string[];
  badgeProgress?: Record<string, number>;
  onBadgePress?: (badge: Badge) => void;
  columns?: number;
}

export function BadgeGrid({
  badges,
  earnedBadgeIds,
  badgeProgress = {},
  onBadgePress,
  columns = 4,
}: BadgeGridProps) {
  const earnedSet = new Set(earnedBadgeIds);

  // Sort: earned first, then by rarity (legendary > epic > rare > common)
  const rarityOrder: Record<BadgeRarity, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3,
  };

  const sortedBadges = [...badges].sort((a, b) => {
    const aEarned = earnedSet.has(a.id);
    const bEarned = earnedSet.has(b.id);
    if (aEarned !== bEarned) return aEarned ? -1 : 1;
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  return (
    <View className="flex-row flex-wrap justify-start">
      {sortedBadges.map((badge) => (
        <View
          key={badge.id}
          style={{ width: `${100 / columns}%` }}
          className="p-2"
        >
          <BadgeCard
            badge={badge}
            isEarned={earnedSet.has(badge.id)}
            progress={badgeProgress[badge.id] || 0}
            onPress={onBadgePress ? () => onBadgePress(badge) : undefined}
            size="small"
          />
        </View>
      ))}
    </View>
  );
}
