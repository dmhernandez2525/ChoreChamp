// Phase 18: Communication & Calendar Integration (F18.1-F18.5)

// F18.1 Calendar Sync
export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'ical';

export type CalendarSyncDirection = 'push' | 'pull' | 'bidirectional';

export type CalendarSyncStatus = 'active' | 'paused' | 'error' | 'disconnected';

export interface CalendarConnection {
  id: string;
  householdId: string;
  memberId: string;
  provider: CalendarProvider;
  calendarId: string;
  calendarName: string;
  syncDirection: CalendarSyncDirection;
  status: CalendarSyncStatus;
  lastSyncAt: string | null;
  syncErrors: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarConnectionRequest {
  provider: CalendarProvider;
  calendarId: string;
  calendarName: string;
  syncDirection: CalendarSyncDirection;
  accessToken: string;
  refreshToken?: string;
}

export interface CalendarEvent {
  id: string;
  connectionId: string;
  choreId: string;
  externalEventId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  recurrence: string | null;
  lastSyncAt: string;
}

export interface CalendarSyncConfig {
  id: string;
  householdId: string;
  includeChoreDetails: boolean;
  includeAssignee: boolean;
  includePoints: boolean;
  reminderMinutes: number;
  colorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCalendarSyncConfigRequest {
  includeChoreDetails?: boolean;
  includeAssignee?: boolean;
  includePoints?: boolean;
  reminderMinutes?: number;
  colorCode?: string | null;
}

// F18.2 Family Chat/Messaging
export type MessageType = 'text' | 'image' | 'chore_share' | 'achievement' | 'system';

export type ChatChannelType = 'household' | 'direct' | 'chore_discussion';

export interface ChatChannel {
  id: string;
  householdId: string;
  name: string;
  type: ChatChannelType;
  participantIds: string[];
  choreId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  type: MessageType;
  content: string;
  imageUrl: string | null;
  referenceId: string | null;
  isEdited: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatMessageRequest {
  content: string;
  type: MessageType;
  imageUrl?: string;
  referenceId?: string;
}

export interface CreateChatChannelRequest {
  name: string;
  type: ChatChannelType;
  participantIds: string[];
  choreId?: string;
}

export interface ChatUnreadCount {
  channelId: string;
  count: number;
}

// F18.3 Family Photo Album
export type AlbumType = 'chore_completions' | 'achievements' | 'milestones' | 'general' | 'auto_generated';

export interface PhotoAlbum {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  coverPhotoUrl: string | null;
  type: AlbumType;
  photoCount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlbumPhoto {
  id: string;
  albumId: string;
  householdId: string;
  uploadedById: string;
  uploaderName: string;
  url: string;
  thumbnailUrl: string;
  caption: string | null;
  choreId: string | null;
  takenAt: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface CreatePhotoAlbumRequest {
  name: string;
  description?: string;
  type: AlbumType;
}

export interface UploadPhotoRequest {
  albumId: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  choreId?: string;
  takenAt?: string;
}

// F18.4 Shareable Achievements
export type SharePlatform = 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'link' | 'email';

export type AchievementCardStyle = 'minimal' | 'colorful' | 'animated' | 'classic';

export interface ShareableAchievement {
  id: string;
  householdId: string;
  memberId: string;
  memberName: string;
  achievementType: string;
  title: string;
  description: string;
  imageUrl: string | null;
  cardStyle: AchievementCardStyle;
  shareUrl: string;
  viewCount: number;
  shareCount: number;
  createdAt: string;
  expiresAt: string | null;
}

export interface CreateShareableAchievementRequest {
  achievementType: string;
  title: string;
  description: string;
  cardStyle: AchievementCardStyle;
  imageUrl?: string;
  expiresInDays?: number;
}

export interface ShareRecord {
  id: string;
  achievementId: string;
  platform: SharePlatform;
  sharedAt: string;
}

export interface ShareSettings {
  id: string;
  householdId: string;
  enableSharing: boolean;
  defaultCardStyle: AchievementCardStyle;
  includeHouseholdName: boolean;
  includeMemberAvatar: boolean;
  autoShareBadges: boolean;
  autoShareStreakMilestones: boolean;
  parentApprovalRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateShareSettingsRequest {
  enableSharing?: boolean;
  defaultCardStyle?: AchievementCardStyle;
  includeHouseholdName?: boolean;
  includeMemberAvatar?: boolean;
  autoShareBadges?: boolean;
  autoShareStreakMilestones?: boolean;
  parentApprovalRequired?: boolean;
}

// F18.5 Progressive Unlocks
export type UnlockCategory = 'feature' | 'cosmetic' | 'gamification' | 'social' | 'advanced';

export type UnlockTrigger = 'days_active' | 'chores_completed' | 'streak_reached' | 'badges_earned' | 'level_reached';

export interface ProgressiveUnlock {
  id: string;
  name: string;
  description: string;
  category: UnlockCategory;
  trigger: UnlockTrigger;
  threshold: number;
  iconUrl: string | null;
  sortOrder: number;
}

export interface MemberUnlockProgress {
  id: string;
  memberId: string;
  householdId: string;
  unlockId: string;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
  notifiedAt: string | null;
}

export interface UnlockProgressSummary {
  totalUnlocks: number;
  unlockedCount: number;
  nextUnlock: ProgressiveUnlock | null;
  nextUnlockProgress: number;
  recentlyUnlocked: Array<ProgressiveUnlock & { unlockedAt: string }>;
}
