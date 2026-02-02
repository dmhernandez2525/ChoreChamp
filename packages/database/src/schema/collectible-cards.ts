// Collectible Card System Schema (F9.4)

import { pgTable, uuid, varchar, text, integer, timestamp, boolean, smallint, index, unique, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

// Card sets (collections/themes)
export const cardSets = pgTable(
  'card_sets',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description').notNull(),
    theme: varchar('theme', { length: 50 }).notNull(),
    totalCards: smallint('total_cards').notNull(),
    releaseDate: timestamp('release_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    bonusEffect: jsonb('bonus_effect'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  }
);

// Card definitions (templates)
export const cards = pgTable(
  'cards',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description').notNull(),
    flavorText: text('flavor_text'),
    category: varchar('category', { length: 30 }).notNull(), // 'chore_heroes', 'power_ups', etc.
    rarity: varchar('rarity', { length: 20 }).notNull(), // 'common', 'uncommon', etc.
    artwork: text('artwork').notNull(),
    borderColor: varchar('border_color', { length: 7 }).notNull(),
    effect: jsonb('effect'), // CardEffect JSON
    setId: varchar('set_id', { length: 50 })
      .notNull()
      .references(() => cardSets.id),
    setNumber: smallint('set_number').notNull(),
    totalInSet: smallint('total_in_set').notNull(),
    pointsValue: integer('points_value').default(10), // Value when converting dupes
    isActive: boolean('is_active').default(true),
    releasedAt: timestamp('released_at', { withTimezone: true }).defaultNow(),
    retiredAt: timestamp('retired_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_cards_set').on(table.setId),
    index('idx_cards_category').on(table.category),
    index('idx_cards_rarity').on(table.rarity),
    unique('unique_card_in_set').on(table.setId, table.setNumber),
  ]
);

// Card packs available for purchase
export const cardPacks = pgTable(
  'card_packs',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description').notNull(),
    packType: varchar('pack_type', { length: 20 }).notNull(), // 'basic', 'premium', etc.
    artwork: text('artwork').notNull(),
    cardCount: smallint('card_count').notNull().default(5),
    pointCost: integer('point_cost').notNull(),
    coinCost: integer('coin_cost'),
    guaranteedRarity: varchar('guaranteed_rarity', { length: 20 }),
    rarityWeights: jsonb('rarity_weights').notNull(), // RarityWeights JSON
    isActive: boolean('is_active').default(true),
    availableFrom: timestamp('available_from', { withTimezone: true }),
    availableUntil: timestamp('available_until', { withTimezone: true }),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_card_packs_type').on(table.packType),
    index('idx_card_packs_active').on(table.isActive),
  ]
);

// Member's owned cards
export const ownedCards = pgTable(
  'owned_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cardId: varchar('card_id', { length: 100 })
      .notNull()
      .references(() => cards.id),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    isFavorite: boolean('is_favorite').default(false),
    isNew: boolean('is_new').default(true),
    firstObtainedAt: timestamp('first_obtained_at', { withTimezone: true }).defaultNow(),
    lastObtainedAt: timestamp('last_obtained_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_owned_cards_member').on(table.memberId),
    index('idx_owned_cards_household').on(table.householdId),
    index('idx_owned_cards_card').on(table.cardId),
    unique('unique_owned_card').on(table.cardId, table.memberId),
  ]
);

// Pack opening history
export const packOpenings = pgTable(
  'pack_openings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    packId: varchar('pack_id', { length: 50 })
      .notNull()
      .references(() => cardPacks.id),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    pointsSpent: integer('points_spent').notNull(),
    cardsReceived: jsonb('cards_received').notNull(), // Array of card IDs
    newCardsCount: smallint('new_cards_count').notNull(),
    duplicateCardsCount: smallint('duplicate_cards_count').notNull(),
    highestRarity: varchar('highest_rarity', { length: 20 }).notNull(),
    openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_pack_openings_member').on(table.memberId),
    index('idx_pack_openings_pack').on(table.packId),
    index('idx_pack_openings_date').on(table.openedAt),
  ]
);

// Card trades between household members
export const cardTrades = pgTable(
  'card_trades',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    initiatorMemberId: uuid('initiator_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    targetMemberId: uuid('target_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    offeredCards: jsonb('offered_cards').notNull(), // Array of { cardId, quantity }
    requestedCards: jsonb('requested_cards').notNull(),
    message: text('message'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_card_trades_household').on(table.householdId),
    index('idx_card_trades_initiator').on(table.initiatorMemberId),
    index('idx_card_trades_target').on(table.targetMemberId),
    index('idx_card_trades_status').on(table.status),
  ]
);

// Card wishlists
export const cardWishlists = pgTable(
  'card_wishlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    cardId: varchar('card_id', { length: 100 })
      .notNull()
      .references(() => cards.id),
    priority: smallint('priority').default(5),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_card_wishlists_member').on(table.memberId),
    unique('unique_wishlist_card').on(table.memberId, table.cardId),
  ]
);

// Card showcases for profiles
export const cardShowcases = pgTable(
  'card_showcases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' })
      .unique(),
    title: varchar('title', { length: 100 }).default('My Collection'),
    cardIds: text('card_ids').array().default([]),
    layout: varchar('layout', { length: 20 }).default('grid'),
    isPublic: boolean('is_public').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_card_showcases_member').on(table.memberId),
  ]
);

// Set completion tracking
export const setCompletions = pgTable(
  'set_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    setId: varchar('set_id', { length: 50 })
      .notNull()
      .references(() => cardSets.id),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
    bonusClaimed: boolean('bonus_claimed').default(false),
  },
  (table) => [
    index('idx_set_completions_member').on(table.memberId),
    unique('unique_set_completion').on(table.memberId, table.setId),
  ]
);

// Card rewards (earned through gameplay)
export const cardRewards = pgTable(
  'card_rewards',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    rewardType: varchar('reward_type', { length: 30 }).notNull(), // 'daily_login', 'achievement', etc.
    targetType: varchar('target_type', { length: 20 }).notNull(), // 'specific_card', 'random_card', 'pack'
    cardId: varchar('card_id', { length: 100 }).references(() => cards.id),
    packId: varchar('pack_id', { length: 50 }).references(() => cardPacks.id),
    rarity: varchar('rarity', { length: 20 }),
    quantity: smallint('quantity').default(1),
    description: text('description').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  }
);

// Collection stats cache (for performance)
export const collectionStats = pgTable(
  'collection_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' })
      .unique(),
    totalCardsOwned: integer('total_cards_owned').default(0),
    uniqueCardsOwned: integer('unique_cards_owned').default(0),
    favoriteCount: integer('favorite_count').default(0),
    packsOpened: integer('packs_opened').default(0),
    tradesCompleted: integer('trades_completed').default(0),
    rarityCounts: jsonb('rarity_counts').default({}),
    categoryCounts: jsonb('category_counts').default({}),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_collection_stats_member').on(table.memberId),
  ]
);

// Relations
export const cardSetsRelations = relations(cardSets, ({ many }) => ({
  cards: many(cards),
  completions: many(setCompletions),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  set: one(cardSets, {
    fields: [cards.setId],
    references: [cardSets.id],
  }),
  ownedInstances: many(ownedCards),
  wishlists: many(cardWishlists),
}));

export const cardPacksRelations = relations(cardPacks, ({ many }) => ({
  openings: many(packOpenings),
}));

export const ownedCardsRelations = relations(ownedCards, ({ one }) => ({
  card: one(cards, {
    fields: [ownedCards.cardId],
    references: [cards.id],
  }),
  member: one(members, {
    fields: [ownedCards.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [ownedCards.householdId],
    references: [households.id],
  }),
}));

export const packOpeningsRelations = relations(packOpenings, ({ one }) => ({
  pack: one(cardPacks, {
    fields: [packOpenings.packId],
    references: [cardPacks.id],
  }),
  member: one(members, {
    fields: [packOpenings.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [packOpenings.householdId],
    references: [households.id],
  }),
}));

export const cardTradesRelations = relations(cardTrades, ({ one }) => ({
  household: one(households, {
    fields: [cardTrades.householdId],
    references: [households.id],
  }),
  initiator: one(members, {
    fields: [cardTrades.initiatorMemberId],
    references: [members.id],
  }),
  target: one(members, {
    fields: [cardTrades.targetMemberId],
    references: [members.id],
  }),
}));

export const cardWishlistsRelations = relations(cardWishlists, ({ one }) => ({
  member: one(members, {
    fields: [cardWishlists.memberId],
    references: [members.id],
  }),
  card: one(cards, {
    fields: [cardWishlists.cardId],
    references: [cards.id],
  }),
}));

export const cardShowcasesRelations = relations(cardShowcases, ({ one }) => ({
  member: one(members, {
    fields: [cardShowcases.memberId],
    references: [members.id],
  }),
}));

export const setCompletionsRelations = relations(setCompletions, ({ one }) => ({
  member: one(members, {
    fields: [setCompletions.memberId],
    references: [members.id],
  }),
  set: one(cardSets, {
    fields: [setCompletions.setId],
    references: [cardSets.id],
  }),
}));

export const collectionStatsRelations = relations(collectionStats, ({ one }) => ({
  member: one(members, {
    fields: [collectionStats.memberId],
    references: [members.id],
  }),
}));
