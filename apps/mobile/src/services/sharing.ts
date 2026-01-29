import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { createInviteLink, getAppStoreLink } from './linking';

export interface ShareContent {
  title?: string;
  message: string;
  url?: string;
}

export interface ShareResult {
  success: boolean;
  action?: 'sharedAction' | 'dismissedAction';
}

/**
 * Check if sharing is available on this device
 */
export async function isSharingAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}

/**
 * Share content using the native share sheet
 */
export async function shareContent(content: ShareContent): Promise<ShareResult> {
  try {
    const shareOptions = {
      title: content.title,
      message: content.url
        ? `${content.message}\n\n${content.url}`
        : content.message,
      url: Platform.OS === 'ios' ? content.url : undefined,
    };

    const result = await Share.share(shareOptions);

    if (result.action === Share.sharedAction) {
      return { success: true, action: 'sharedAction' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, action: 'dismissedAction' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to share content:', error);
    return { success: false };
  }
}

/**
 * Share an invite link
 */
export async function shareInviteLink(
  inviteCode: string,
  householdName: string
): Promise<ShareResult> {
  const url = createInviteLink(inviteCode);
  return shareContent({
    title: 'Join My Household on ChoreChamp',
    message: `Join "${householdName}" on ChoreChamp! Use this link to join and start tracking chores together.`,
    url,
  });
}

/**
 * Share achievement
 */
export async function shareAchievement(
  achievementName: string,
  achievementDescription: string,
  memberName: string
): Promise<ShareResult> {
  return shareContent({
    title: `${memberName} earned an achievement!`,
    message: `🏆 ${memberName} just earned the "${achievementName}" badge on ChoreChamp!\n\n${achievementDescription}`,
    url: getAppStoreLink(),
  });
}

/**
 * Share streak milestone
 */
export async function shareStreakMilestone(
  streakDays: number,
  memberName: string
): Promise<ShareResult> {
  const emoji = streakDays >= 30 ? '🔥🔥🔥' : streakDays >= 7 ? '🔥🔥' : '🔥';
  return shareContent({
    title: 'Streak Milestone!',
    message: `${emoji} ${memberName} is on a ${streakDays}-day streak on ChoreChamp! Consistency pays off!`,
    url: getAppStoreLink(),
  });
}

/**
 * Share points milestone
 */
export async function sharePointsMilestone(
  points: number,
  memberName: string,
  pointsName: string = 'points'
): Promise<ShareResult> {
  return shareContent({
    title: 'Points Milestone!',
    message: `💰 ${memberName} has earned ${points.toLocaleString()} ${pointsName} on ChoreChamp!`,
    url: getAppStoreLink(),
  });
}

/**
 * Share the app
 */
export async function shareApp(): Promise<ShareResult> {
  return shareContent({
    title: 'Check out ChoreChamp!',
    message: 'ChoreChamp helps families track and gamify household chores. Kids earn points and rewards for completing tasks!',
    url: getAppStoreLink(),
  });
}

/**
 * Share a reward redemption
 */
export async function shareRewardRedemption(
  rewardName: string,
  memberName: string,
  pointsCost: number,
  pointsName: string = 'points'
): Promise<ShareResult> {
  return shareContent({
    title: 'Reward Redeemed!',
    message: `🎁 ${memberName} just redeemed "${rewardName}" for ${pointsCost} ${pointsName} on ChoreChamp!`,
    url: getAppStoreLink(),
  });
}

/**
 * Share weekly summary
 */
export async function shareWeeklySummary(
  choresCompleted: number,
  pointsEarned: number,
  memberName: string,
  pointsName: string = 'points'
): Promise<ShareResult> {
  return shareContent({
    title: 'Weekly Summary',
    message: `📊 ${memberName}'s week on ChoreChamp:\n✓ ${choresCompleted} chores completed\n💰 ${pointsEarned} ${pointsName} earned`,
    url: getAppStoreLink(),
  });
}

/**
 * Create shareable text for clipboard
 */
export function createShareableText(
  type: 'invite' | 'achievement' | 'streak' | 'points',
  data: Record<string, string | number>
): string {
  switch (type) {
    case 'invite':
      return `Join my household "${data.householdName}" on ChoreChamp!\n${createInviteLink(data.inviteCode as string)}`;

    case 'achievement':
      return `🏆 I just earned the "${data.achievementName}" badge on ChoreChamp!`;

    case 'streak':
      return `🔥 I'm on a ${data.streakDays}-day streak on ChoreChamp!`;

    case 'points':
      return `💰 I've earned ${(data.points as number).toLocaleString()} ${data.pointsName || 'points'} on ChoreChamp!`;

    default:
      return 'Check out ChoreChamp!';
  }
}

/**
 * Share a file (image, etc.)
 */
export async function shareFile(fileUri: string): Promise<ShareResult> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false };
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'image/png',
      dialogTitle: 'Share Image',
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to share file:', error);
    return { success: false };
  }
}

/**
 * Generate social media share URLs
 */
export const SocialShareUrls = {
  twitter: (text: string, url?: string) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = url ? encodeURIComponent(url) : '';
    return `https://twitter.com/intent/tweet?text=${encodedText}${encodedUrl ? `&url=${encodedUrl}` : ''}`;
  },

  facebook: (url: string) => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  },

  whatsapp: (text: string) => {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  },

  telegram: (text: string, url?: string) => {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = url ? encodeURIComponent(url) : '';
    return `https://t.me/share/url?text=${encodedText}${encodedUrl ? `&url=${encodedUrl}` : ''}`;
  },
};
