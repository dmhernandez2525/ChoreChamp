import { pgTable, uuid, varchar, integer, timestamp, boolean, text, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

// Mini-game definitions (global)
export const miniGames = pgTable('mini_games', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 30 }).notNull(), // 'puzzle', 'sorting', 'time-challenge', 'memory', 'multiplayer'
  icon: varchar('icon', { length: 50 }).notNull(),
  thumbnail: varchar('thumbnail', { length: 200 }).notNull(),
  minPlayers: integer('min_players').notNull().default(1),
  maxPlayers: integer('max_players').notNull().default(1),
  estimatedDuration: integer('estimated_duration').notNull().default(5), // minutes
  baseXPReward: integer('base_xp_reward').notNull().default(10),
  basePointReward: integer('base_point_reward').notNull().default(5),
  unlockType: varchar('unlock_type', { length: 30 }).notNull().default('default'),
  unlockValue: integer('unlock_value'),
  unlockAchievementId: varchar('unlock_achievement_id', { length: 50 }),
  instructions: text('instructions'),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Game configurations per difficulty
export const gameConfigs = pgTable(
  'game_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: varchar('game_id', { length: 50 })
      .notNull()
      .references(() => miniGames.id, { onDelete: 'cascade' }),
    difficulty: varchar('difficulty', { length: 20 }).notNull(), // 'easy', 'medium', 'hard', 'expert'
    timeLimit: integer('time_limit').notNull().default(0), // seconds, 0 = no limit
    targetScore: integer('target_score').notNull().default(100),
    config: jsonb('config').notNull().default({}).$type<{
      gridSize?: { rows: number; cols: number };
      itemCount?: number;
      mistakesAllowed?: number;
      bonusTimeItems?: number;
      speedMultiplier?: number;
      [key: string]: unknown;
    }>(),
    xpMultiplier: integer('xp_multiplier').notNull().default(100), // percentage
    pointMultiplier: integer('point_multiplier').notNull().default(100), // percentage
  },
  (table) => [
    index('idx_game_configs_game').on(table.gameId),
  ]
);

// Member's unlocked games
export const gameUnlocks = pgTable(
  'game_unlocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: varchar('game_id', { length: 50 })
      .notNull()
      .references(() => miniGames.id),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
    highScore: integer('high_score').notNull().default(0),
    playCount: integer('play_count').notNull().default(0),
    totalXPEarned: integer('total_xp_earned').notNull().default(0),
    totalPointsEarned: integer('total_points_earned').notNull().default(0),
    lastPlayedAt: timestamp('last_played_at', { withTimezone: true }),
    bestDifficulty: varchar('best_difficulty', { length: 20 }).default('easy'),
    bestTime: integer('best_time'), // seconds
    perfectGames: integer('perfect_games').notNull().default(0),
  },
  (table) => [
    index('idx_game_unlocks_member').on(table.memberId),
    index('idx_game_unlocks_household').on(table.householdId),
    index('idx_game_unlocks_game').on(table.gameId),
  ]
);

// Game sessions
export const gameSessions = pgTable(
  'game_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: varchar('game_id', { length: 50 })
      .notNull()
      .references(() => miniGames.id),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    difficulty: varchar('difficulty', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'), // 'active', 'completed', 'abandoned'
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    currentRound: integer('current_round').notNull().default(1),
    totalRounds: integer('total_rounds').notNull().default(1),
    gameState: jsonb('game_state').notNull().default({}).$type<Record<string, unknown>>(),
    familyNightId: uuid('family_night_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_game_sessions_household').on(table.householdId),
    index('idx_game_sessions_game').on(table.gameId),
    index('idx_game_sessions_status').on(table.status),
  ]
);

// Session players
export const sessionPlayers = pgTable(
  'session_players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    score: integer('score').notNull().default(0),
    rank: integer('rank'),
    isHost: boolean('is_host').default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_session_players_session').on(table.sessionId),
    index('idx_session_players_member').on(table.memberId),
  ]
);

// Game scores (historical records)
export const gameScores = pgTable(
  'game_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: varchar('game_id', { length: 50 })
      .notNull()
      .references(() => miniGames.id),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .references(() => gameSessions.id, { onDelete: 'set null' }),
    difficulty: varchar('difficulty', { length: 20 }).notNull(),
    score: integer('score').notNull(),
    timeElapsed: integer('time_elapsed').notNull(), // seconds
    accuracy: integer('accuracy').notNull().default(100), // percentage
    combo: integer('combo').notNull().default(0),
    stars: integer('stars').notNull().default(1), // 1-3
    xpEarned: integer('xp_earned').notNull().default(0),
    pointsEarned: integer('points_earned').notNull().default(0),
    isPerfect: boolean('is_perfect').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_game_scores_member').on(table.memberId),
    index('idx_game_scores_household').on(table.householdId),
    index('idx_game_scores_game').on(table.gameId),
    index('idx_game_scores_score').on(table.score),
  ]
);

// Family game nights
export const familyGameNights = pgTable(
  'family_game_nights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('scheduled'), // 'scheduled', 'active', 'completed', 'cancelled'
    hostMemberId: uuid('host_member_id')
      .notNull()
      .references(() => members.id),
    bonusMultiplier: integer('bonus_multiplier').notNull().default(150), // percentage
    totalGamesPlayed: integer('total_games_played').notNull().default(0),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_family_game_nights_household').on(table.householdId),
    index('idx_family_game_nights_status').on(table.status),
    index('idx_family_game_nights_scheduled').on(table.scheduledAt),
  ]
);

// Family night games
export const familyNightGames = pgTable(
  'family_night_games',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyNightId: uuid('family_night_id')
      .notNull()
      .references(() => familyGameNights.id, { onDelete: 'cascade' }),
    gameId: varchar('game_id', { length: 50 })
      .notNull()
      .references(() => miniGames.id),
    order: integer('order').notNull(),
    sessionId: uuid('session_id')
      .references(() => gameSessions.id),
    winnerId: uuid('winner_id')
      .references(() => members.id),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'active', 'completed', 'skipped'
  },
  (table) => [
    index('idx_family_night_games_night').on(table.familyNightId),
  ]
);

// Family night participants
export const familyNightParticipants = pgTable(
  'family_night_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyNightId: uuid('family_night_id')
      .notNull()
      .references(() => familyGameNights.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    totalScore: integer('total_score').notNull().default(0),
    gamesWon: integer('games_won').notNull().default(0),
    isReady: boolean('is_ready').default(false),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_family_night_participants_night').on(table.familyNightId),
    index('idx_family_night_participants_member').on(table.memberId),
  ]
);

// Relations
export const miniGamesRelations = relations(miniGames, ({ many }) => ({
  configs: many(gameConfigs),
  unlocks: many(gameUnlocks),
  sessions: many(gameSessions),
  scores: many(gameScores),
}));

export const gameConfigsRelations = relations(gameConfigs, ({ one }) => ({
  game: one(miniGames, {
    fields: [gameConfigs.gameId],
    references: [miniGames.id],
  }),
}));

export const gameUnlocksRelations = relations(gameUnlocks, ({ one }) => ({
  game: one(miniGames, {
    fields: [gameUnlocks.gameId],
    references: [miniGames.id],
  }),
  member: one(members, {
    fields: [gameUnlocks.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [gameUnlocks.householdId],
    references: [households.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  game: one(miniGames, {
    fields: [gameSessions.gameId],
    references: [miniGames.id],
  }),
  household: one(households, {
    fields: [gameSessions.householdId],
    references: [households.id],
  }),
  players: many(sessionPlayers),
  scores: many(gameScores),
}));

export const sessionPlayersRelations = relations(sessionPlayers, ({ one }) => ({
  session: one(gameSessions, {
    fields: [sessionPlayers.sessionId],
    references: [gameSessions.id],
  }),
  member: one(members, {
    fields: [sessionPlayers.memberId],
    references: [members.id],
  }),
}));

export const gameScoresRelations = relations(gameScores, ({ one }) => ({
  game: one(miniGames, {
    fields: [gameScores.gameId],
    references: [miniGames.id],
  }),
  member: one(members, {
    fields: [gameScores.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [gameScores.householdId],
    references: [households.id],
  }),
  session: one(gameSessions, {
    fields: [gameScores.sessionId],
    references: [gameSessions.id],
  }),
}));

export const familyGameNightsRelations = relations(familyGameNights, ({ one, many }) => ({
  household: one(households, {
    fields: [familyGameNights.householdId],
    references: [households.id],
  }),
  host: one(members, {
    fields: [familyGameNights.hostMemberId],
    references: [members.id],
  }),
  games: many(familyNightGames),
  participants: many(familyNightParticipants),
}));

export const familyNightGamesRelations = relations(familyNightGames, ({ one }) => ({
  familyNight: one(familyGameNights, {
    fields: [familyNightGames.familyNightId],
    references: [familyGameNights.id],
  }),
  game: one(miniGames, {
    fields: [familyNightGames.gameId],
    references: [miniGames.id],
  }),
  session: one(gameSessions, {
    fields: [familyNightGames.sessionId],
    references: [gameSessions.id],
  }),
  winner: one(members, {
    fields: [familyNightGames.winnerId],
    references: [members.id],
  }),
}));

export const familyNightParticipantsRelations = relations(familyNightParticipants, ({ one }) => ({
  familyNight: one(familyGameNights, {
    fields: [familyNightParticipants.familyNightId],
    references: [familyGameNights.id],
  }),
  member: one(members, {
    fields: [familyNightParticipants.memberId],
    references: [members.id],
  }),
}));
