import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { members } from './members';

export const forumPosts = pgTable(
  'forum_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 32 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    isPinned: boolean('is_pinned').notNull().default(false),
    isLocked: boolean('is_locked').notNull().default(false),
    likeCount: integer('like_count').notNull().default(0),
    replyCount: integer('reply_count').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),
    tags: jsonb('tags').notNull().default('[]'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_forum_posts_category').on(table.category),
    index('idx_forum_posts_author_id').on(table.authorId),
    index('idx_forum_posts_created_at').on(table.createdAt),
  ]
);

export const forumReplies = pgTable(
  'forum_replies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => forumPosts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    likeCount: integer('like_count').notNull().default(0),
    parentReplyId: uuid('parent_reply_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_forum_replies_post_id').on(table.postId),
    index('idx_forum_replies_author_id').on(table.authorId),
  ]
);

export const socialChallenges = pgTable(
  'social_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    challengeType: varchar('challenge_type', { length: 32 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('upcoming'),
    targetValue: integer('target_value').notNull(),
    metric: varchar('metric', { length: 64 }).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    participantCount: integer('participant_count').notNull().default(0),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    prize: text('prize'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_social_challenges_status').on(table.status),
    index('idx_social_challenges_created_by_id').on(table.createdById),
    index('idx_social_challenges_start_date').on(table.startDate),
  ]
);

export const socialChallengeParticipants = pgTable(
  'social_challenge_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => socialChallenges.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id').notNull(),
    householdName: varchar('household_name', { length: 200 }).notNull(),
    currentValue: integer('current_value').notNull().default(0),
    rank: integer('rank').notNull().default(0),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_social_challenge_participants_challenge_id').on(table.challengeId),
    index('idx_social_challenge_participants_household_id').on(table.householdId),
  ]
);

export const socialPosts = pgTable(
  'social_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').notNull(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    shareType: varchar('share_type', { length: 32 }).notNull(),
    visibility: varchar('visibility', { length: 16 }).notNull().default('friends'),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    imageUrl: text('image_url'),
    referenceId: uuid('reference_id'),
    referenceType: varchar('reference_type', { length: 64 }),
    likeCount: integer('like_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_social_posts_household_id').on(table.householdId),
    index('idx_social_posts_author_id').on(table.authorId),
    index('idx_social_posts_share_type').on(table.shareType),
    index('idx_social_posts_created_at').on(table.createdAt),
  ]
);

export const socialComments = pgTable(
  'social_comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => socialPosts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    likeCount: integer('like_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_social_comments_post_id').on(table.postId),
    index('idx_social_comments_author_id').on(table.authorId),
  ]
);

export const friendConnections = pgTable(
  'friend_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requesterHouseholdId: uuid('requester_household_id').notNull(),
    requesterHouseholdName: varchar('requester_household_name', { length: 200 }).notNull(),
    recipientHouseholdId: uuid('recipient_household_id').notNull(),
    recipientHouseholdName: varchar('recipient_household_name', { length: 200 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    message: text('message'),
    connectedAt: timestamp('connected_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_friend_connections_requester_household_id').on(table.requesterHouseholdId),
    index('idx_friend_connections_recipient_household_id').on(table.recipientHouseholdId),
    index('idx_friend_connections_status').on(table.status),
  ]
);

export const communityEvents = pgTable(
  'community_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    eventType: varchar('event_type', { length: 32 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('draft'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    location: text('location'),
    isVirtual: boolean('is_virtual').notNull().default(false),
    maxParticipants: integer('max_participants'),
    currentParticipants: integer('current_participants').notNull().default(0),
    organizerHouseholdId: uuid('organizer_household_id').notNull(),
    organizerName: varchar('organizer_name', { length: 200 }).notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_community_events_event_type').on(table.eventType),
    index('idx_community_events_status').on(table.status),
    index('idx_community_events_start_date').on(table.startDate),
    index('idx_community_events_organizer_household_id').on(table.organizerHouseholdId),
  ]
);

export const communityEventParticipations = pgTable(
  'community_event_participations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => communityEvents.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id').notNull(),
    householdName: varchar('household_name', { length: 200 }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('registered'),
    registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_community_event_participations_event_id').on(table.eventId),
    index('idx_community_event_participations_household_id').on(table.householdId),
  ]
);

export const forumPostsRelations = relations(forumPosts, ({ many }) => ({
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  post: one(forumPosts, {
    fields: [forumReplies.postId],
    references: [forumPosts.id],
  }),
}));

export const socialChallengesRelations = relations(socialChallenges, ({ many }) => ({
  participants: many(socialChallengeParticipants),
}));

export const socialChallengeParticipantsRelations = relations(
  socialChallengeParticipants,
  ({ one }) => ({
    challenge: one(socialChallenges, {
      fields: [socialChallengeParticipants.challengeId],
      references: [socialChallenges.id],
    }),
  })
);

export const socialPostsRelations = relations(socialPosts, ({ many }) => ({
  comments: many(socialComments),
}));

export const socialCommentsRelations = relations(socialComments, ({ one }) => ({
  post: one(socialPosts, {
    fields: [socialComments.postId],
    references: [socialPosts.id],
  }),
}));

export const communityEventsRelations = relations(communityEvents, ({ many }) => ({
  participations: many(communityEventParticipations),
}));

export const communityEventParticipationsRelations = relations(
  communityEventParticipations,
  ({ one }) => ({
    event: one(communityEvents, {
      fields: [communityEventParticipations.eventId],
      references: [communityEvents.id],
    }),
  })
);
