import { pgTable, uuid, varchar, integer, timestamp, boolean, text, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

// Character classes definition (global)
export const characterClasses = pgTable('character_classes', {
  id: varchar('id', { length: 50 }).primaryKey(), // 'cleaner', 'organizer', etc.
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  primaryStat: varchar('primary_stat', { length: 20 }).notNull(), // 'speed', 'quality', etc.
  color: varchar('color', { length: 7 }).notNull(), // Hex color
  sortOrder: integer('sort_order').default(0),
});

// Character skills definition (global)
export const characterSkills = pgTable('character_skills', {
  id: varchar('id', { length: 50 }).primaryKey(),
  classId: varchar('class_id', { length: 50 })
    .notNull()
    .references(() => characterClasses.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  levelRequired: integer('level_required').notNull().default(1),
  effects: jsonb('effects').notNull(), // Array of SkillEffect
  sortOrder: integer('sort_order').default(0),
});

// Avatar items definition (global)
export const avatarItems = pgTable(
  'avatar_items',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    category: varchar('category', { length: 30 }).notNull(), // 'skin_tone', 'hair_style', etc.
    name: varchar('name', { length: 100 }).notNull(),
    icon: varchar('icon', { length: 200 }), // Could be SVG path or emoji
    rarity: varchar('rarity', { length: 20 }).notNull().default('common'),
    unlockType: varchar('unlock_type', { length: 20 }).notNull().default('default'),
    unlockLevel: integer('unlock_level'),
    unlockAchievementId: varchar('unlock_achievement_id', { length: 50 }),
    unlockSeasonalEventId: varchar('unlock_seasonal_event_id', { length: 50 }),
    unlockCost: integer('unlock_cost'),
    isDefault: boolean('is_default').default(false),
    sortOrder: integer('sort_order').default(0),
  },
  (table) => [
    index('idx_avatar_items_category').on(table.category),
    index('idx_avatar_items_unlock').on(table.unlockType),
  ]
);

// Member character profiles
export const characterProfiles = pgTable(
  'character_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' })
      .unique(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),

    // Character class
    classId: varchar('class_id', { length: 50 })
      .notNull()
      .references(() => characterClasses.id),
    classChangedAt: timestamp('class_changed_at', { withTimezone: true }),

    // Level and XP
    level: integer('level').notNull().default(1),
    xp: integer('xp').notNull().default(0),
    xpLifetime: integer('xp_lifetime').notNull().default(0),

    // Stats
    statSpeed: integer('stat_speed').notNull().default(5),
    statQuality: integer('stat_quality').notNull().default(5),
    statConsistency: integer('stat_consistency').notNull().default(5),
    statTeamwork: integer('stat_teamwork').notNull().default(5),
    statPointsAvailable: integer('stat_points_available').notNull().default(0),

    // Avatar customization (JSONB)
    avatar: jsonb('avatar').notNull().$type<{
      skinTone: string;
      hairStyle: string;
      hairColor: string;
      eyeColor: string;
      faceShape: string;
      outfit: string;
      outfitColor: string;
      accessories: string[];
      background: string;
      frame: string;
    }>(),

    // Unlocked items (array of item IDs)
    unlockedItems: text('unlocked_items').array().default([]),

    // Titles
    titles: text('titles').array().default([]),
    activeTitle: varchar('active_title', { length: 100 }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_character_profiles_member').on(table.memberId),
    index('idx_character_profiles_household').on(table.householdId),
    index('idx_character_profiles_class').on(table.classId),
    index('idx_character_profiles_level').on(table.level),
  ]
);

// Member learned skills
export const memberSkills = pgTable(
  'member_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    skillId: varchar('skill_id', { length: 50 })
      .notNull()
      .references(() => characterSkills.id),

    level: integer('level').notNull().default(1),
    xp: integer('xp').notNull().default(0),

    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_member_skills_member').on(table.memberId),
    index('idx_member_skills_skill').on(table.skillId),
  ]
);

// XP transactions (audit log)
export const xpTransactions = pgTable(
  'xp_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    amount: integer('amount').notNull(),
    balanceAfter: integer('balance_after').notNull(),

    transactionType: varchar('transaction_type', { length: 50 }).notNull(),
    referenceId: uuid('reference_id'),
    referenceType: varchar('reference_type', { length: 50 }),

    description: text('description'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_xp_transactions_member').on(table.memberId),
    index('idx_xp_transactions_household').on(table.householdId, table.createdAt),
  ]
);

// Relations
export const characterClassesRelations = relations(characterClasses, ({ many }) => ({
  skills: many(characterSkills),
  profiles: many(characterProfiles),
}));

export const characterSkillsRelations = relations(characterSkills, ({ one, many }) => ({
  class: one(characterClasses, {
    fields: [characterSkills.classId],
    references: [characterClasses.id],
  }),
  memberSkills: many(memberSkills),
}));

export const characterProfilesRelations = relations(characterProfiles, ({ one }) => ({
  member: one(members, {
    fields: [characterProfiles.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [characterProfiles.householdId],
    references: [households.id],
  }),
  class: one(characterClasses, {
    fields: [characterProfiles.classId],
    references: [characterClasses.id],
  }),
}));

export const memberSkillsRelations = relations(memberSkills, ({ one }) => ({
  member: one(members, {
    fields: [memberSkills.memberId],
    references: [members.id],
  }),
  skill: one(characterSkills, {
    fields: [memberSkills.skillId],
    references: [characterSkills.id],
  }),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  member: one(members, {
    fields: [xpTransactions.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [xpTransactions.householdId],
    references: [households.id],
  }),
}));
