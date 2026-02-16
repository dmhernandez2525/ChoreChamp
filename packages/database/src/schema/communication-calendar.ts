import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// F18.1 Calendar Sync
export const calendarConnections = pgTable(
  'calendar_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    memberId: text('member_id').notNull(),
    provider: text('provider').notNull(),
    calendarId: text('calendar_id').notNull(),
    calendarName: text('calendar_name').notNull(),
    syncDirection: text('sync_direction').notNull().default('push'),
    status: text('status').notNull().default('active'),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token'),
    lastSyncAt: timestamp('last_sync_at'),
    syncErrors: jsonb('sync_errors').notNull().default('[]'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('calendar_connections_household_idx').on(table.householdId),
    index('calendar_connections_member_idx').on(table.memberId),
  ]
);

export const calendarEvents = pgTable(
  'calendar_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    connectionId: text('connection_id').notNull(),
    choreId: text('chore_id').notNull(),
    externalEventId: text('external_event_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    isAllDay: boolean('is_all_day').notNull().default(false),
    recurrence: text('recurrence'),
    lastSyncAt: timestamp('last_sync_at').notNull().defaultNow(),
  },
  (table) => [
    index('calendar_events_connection_idx').on(table.connectionId),
    index('calendar_events_chore_idx').on(table.choreId),
  ]
);

export const calendarSyncConfigs = pgTable(
  'calendar_sync_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    includeChoreDetails: boolean('include_chore_details').notNull().default(true),
    includeAssignee: boolean('include_assignee').notNull().default(true),
    includePoints: boolean('include_points').notNull().default(false),
    reminderMinutes: integer('reminder_minutes').notNull().default(30),
    colorCode: text('color_code'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('calendar_sync_configs_household_idx').on(table.householdId)]
);

// F18.2 Family Chat/Messaging
export const chatChannels = pgTable(
  'chat_channels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull().default('household'),
    participantIds: jsonb('participant_ids').notNull().default('[]'),
    choreId: text('chore_id'),
    lastMessageAt: timestamp('last_message_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('chat_channels_household_idx').on(table.householdId),
    index('chat_channels_type_idx').on(table.type),
  ]
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    channelId: text('channel_id').notNull(),
    senderId: text('sender_id').notNull(),
    senderName: text('sender_name').notNull(),
    type: text('type').notNull().default('text'),
    content: text('content').notNull(),
    imageUrl: text('image_url'),
    referenceId: text('reference_id'),
    isEdited: boolean('is_edited').notNull().default(false),
    readBy: jsonb('read_by').notNull().default('[]'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('chat_messages_channel_idx').on(table.channelId),
    index('chat_messages_sender_idx').on(table.senderId),
    index('chat_messages_created_idx').on(table.createdAt),
  ]
);

// F18.3 Family Photo Album
export const photoAlbums = pgTable(
  'photo_albums',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    coverPhotoUrl: text('cover_photo_url'),
    type: text('type').notNull().default('general'),
    photoCount: integer('photo_count').notNull().default(0),
    createdById: text('created_by_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('photo_albums_household_idx').on(table.householdId)]
);

export const albumPhotos = pgTable(
  'album_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    albumId: text('album_id').notNull(),
    householdId: text('household_id').notNull(),
    uploadedById: text('uploaded_by_id').notNull(),
    uploaderName: text('uploader_name').notNull(),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url').notNull(),
    caption: text('caption'),
    choreId: text('chore_id'),
    takenAt: timestamp('taken_at'),
    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('album_photos_album_idx').on(table.albumId),
    index('album_photos_household_idx').on(table.householdId),
  ]
);

// F18.4 Shareable Achievements
export const shareableAchievements = pgTable(
  'shareable_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    memberId: text('member_id').notNull(),
    memberName: text('member_name').notNull(),
    achievementType: text('achievement_type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
    cardStyle: text('card_style').notNull().default('colorful'),
    shareUrl: text('share_url').notNull(),
    viewCount: integer('view_count').notNull().default(0),
    shareCount: integer('share_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at'),
  },
  (table) => [
    index('shareable_achievements_household_idx').on(table.householdId),
    index('shareable_achievements_member_idx').on(table.memberId),
  ]
);

export const shareRecords = pgTable(
  'share_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    achievementId: text('achievement_id').notNull(),
    platform: text('platform').notNull(),
    sharedAt: timestamp('shared_at').notNull().defaultNow(),
  },
  (table) => [index('share_records_achievement_idx').on(table.achievementId)]
);

export const shareSettings = pgTable(
  'share_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: text('household_id').notNull(),
    enableSharing: boolean('enable_sharing').notNull().default(true),
    defaultCardStyle: text('default_card_style').notNull().default('colorful'),
    includeHouseholdName: boolean('include_household_name').notNull().default(false),
    includeMemberAvatar: boolean('include_member_avatar').notNull().default(true),
    autoShareBadges: boolean('auto_share_badges').notNull().default(false),
    autoShareStreakMilestones: boolean('auto_share_streak_milestones').notNull().default(false),
    parentApprovalRequired: boolean('parent_approval_required').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('share_settings_household_idx').on(table.householdId)]
);

// F18.5 Progressive Unlocks
export const progressiveUnlocks = pgTable(
  'progressive_unlocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    trigger: text('trigger').notNull(),
    threshold: integer('threshold').notNull(),
    iconUrl: text('icon_url'),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('progressive_unlocks_category_idx').on(table.category)]
);

export const memberUnlockProgress = pgTable(
  'member_unlock_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: text('member_id').notNull(),
    householdId: text('household_id').notNull(),
    unlockId: text('unlock_id').notNull(),
    currentProgress: integer('current_progress').notNull().default(0),
    isUnlocked: boolean('is_unlocked').notNull().default(false),
    unlockedAt: timestamp('unlocked_at'),
    notifiedAt: timestamp('notified_at'),
  },
  (table) => [
    index('member_unlock_progress_member_idx').on(table.memberId),
    index('member_unlock_progress_household_idx').on(table.householdId),
    index('member_unlock_progress_unlock_idx').on(table.unlockId),
  ]
);

// Relations
export const chatChannelsRelations = relations(chatChannels, ({ many }) => ({
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  channel: one(chatChannels, {
    fields: [chatMessages.channelId],
    references: [chatChannels.id],
  }),
}));

export const photoAlbumsRelations = relations(photoAlbums, ({ many }) => ({
  photos: many(albumPhotos),
}));

export const albumPhotosRelations = relations(albumPhotos, ({ one }) => ({
  album: one(photoAlbums, {
    fields: [albumPhotos.albumId],
    references: [photoAlbums.id],
  }),
}));

export const shareableAchievementsRelations = relations(shareableAchievements, ({ many }) => ({
  shares: many(shareRecords),
}));

export const shareRecordsRelations = relations(shareRecords, ({ one }) => ({
  achievement: one(shareableAchievements, {
    fields: [shareRecords.achievementId],
    references: [shareableAchievements.id],
  }),
}));
