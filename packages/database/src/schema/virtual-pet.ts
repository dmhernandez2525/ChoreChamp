import { pgTable, uuid, varchar, integer, timestamp, boolean, text, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

// Pet species definition (global)
export const petSpecies = pgTable('pet_species', {
  id: varchar('id', { length: 50 }).primaryKey(), // 'dog', 'cat', 'dragon', etc.
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  baseStats: jsonb('base_stats').notNull().$type<{
    maxHealth: number;
    maxHappiness: number;
    maxEnergy: number;
    healthDecayRate: number;
    happinessDecayRate: number;
    energyRegenRate: number;
  }>(),
  evolutionPath: jsonb('evolution_path').notNull().$type<Array<{
    tier: string;
    name: string;
    icon: string;
    requiredLevel: number;
    statsMultiplier: number;
    unlockedAbilities: string[];
  }>>(),
  specialAbility: varchar('special_ability', { length: 100 }).notNull(),
  sortOrder: integer('sort_order').default(0),
});

// Pet abilities definition (global)
export const petAbilities = pgTable('pet_abilities', {
  id: varchar('id', { length: 50 }).primaryKey(),
  speciesId: varchar('species_id', { length: 50 })
    .references(() => petSpecies.id),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  abilityType: varchar('ability_type', { length: 30 }).notNull(), // 'xp_boost', 'point_boost', etc.
  value: integer('value').notNull(), // Effect value (percentage or flat)
  cooldownHours: integer('cooldown_hours').notNull().default(24),
  unlockTier: varchar('unlock_tier', { length: 20 }).notNull().default('baby'), // 'baby', 'juvenile', 'adult', 'legendary'
  sortOrder: integer('sort_order').default(0),
});

// Pet accessories definition (global)
export const petAccessories = pgTable(
  'pet_accessories',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 200 }),
    category: varchar('category', { length: 30 }).notNull(), // 'hat', 'collar', 'outfit', etc.
    rarity: varchar('rarity', { length: 20 }).notNull().default('common'),
    unlockType: varchar('unlock_type', { length: 20 }).notNull().default('default'),
    unlockLevel: integer('unlock_level'),
    unlockAchievementId: varchar('unlock_achievement_id', { length: 50 }),
    unlockCost: integer('unlock_cost'),
    statBonus: jsonb('stat_bonus').$type<{
      health?: number;
      happiness?: number;
      energy?: number;
    }>(),
    isDefault: boolean('is_default').default(false),
    sortOrder: integer('sort_order').default(0),
  },
  (table) => [
    index('idx_pet_accessories_category').on(table.category),
  ]
);

// Virtual pets (member owned)
export const virtualPets = pgTable(
  'virtual_pets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),

    name: varchar('name', { length: 50 }).notNull(),
    speciesId: varchar('species_id', { length: 50 })
      .notNull()
      .references(() => petSpecies.id),

    // Evolution
    evolutionTier: varchar('evolution_tier', { length: 20 }).notNull().default('baby'),
    level: integer('level').notNull().default(1),
    xp: integer('xp').notNull().default(0),

    // Stats
    statHealth: integer('stat_health').notNull().default(100),
    statMaxHealth: integer('stat_max_health').notNull().default(100),
    statHappiness: integer('stat_happiness').notNull().default(100),
    statMaxHappiness: integer('stat_max_happiness').notNull().default(100),
    statEnergy: integer('stat_energy').notNull().default(100),
    statMaxEnergy: integer('stat_max_energy').notNull().default(100),

    // Current mood (calculated from stats)
    mood: varchar('mood', { length: 20 }).notNull().default('happy'),

    // Equipped accessories (JSON array of accessory IDs)
    equippedAccessories: jsonb('equipped_accessories').notNull().default([]).$type<string[]>(),
    unlockedAccessories: text('unlocked_accessories').array().default([]),

    // Active ability
    activeAbilityId: varchar('active_ability_id', { length: 50 }),
    abilityLastUsedAt: timestamp('ability_last_used_at', { withTimezone: true }),

    // Interaction tracking
    lastFedAt: timestamp('last_fed_at', { withTimezone: true }),
    lastPlayedAt: timestamp('last_played_at', { withTimezone: true }),
    lastPettedAt: timestamp('last_petted_at', { withTimezone: true }),
    lastStatsDecayAt: timestamp('last_stats_decay_at', { withTimezone: true }).defaultNow(),

    // Health tracking
    consecutiveDaysHealthy: integer('consecutive_days_healthy').notNull().default(0),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_virtual_pets_member').on(table.memberId),
    index('idx_virtual_pets_household').on(table.householdId),
    index('idx_virtual_pets_species').on(table.speciesId),
  ]
);

// Pet events log
export const petEvents = pgTable(
  'pet_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    petId: uuid('pet_id')
      .notNull()
      .references(() => virtualPets.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),

    eventType: varchar('event_type', { length: 30 }).notNull(), // 'adopted', 'evolved', 'fed', etc.
    description: text('description'),
    data: jsonb('data').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_pet_events_pet').on(table.petId),
    index('idx_pet_events_member').on(table.memberId),
    index('idx_pet_events_type').on(table.eventType),
  ]
);

// Pet playdates
export const petPlaydates = pgTable(
  'pet_playdates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    hostPetId: uuid('host_pet_id')
      .notNull()
      .references(() => virtualPets.id, { onDelete: 'cascade' }),
    guestPetId: uuid('guest_pet_id')
      .notNull()
      .references(() => virtualPets.id, { onDelete: 'cascade' }),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'active', 'completed', 'cancelled'
    bonusAwarded: boolean('bonus_awarded').default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_pet_playdates_host').on(table.hostPetId),
    index('idx_pet_playdates_guest').on(table.guestPetId),
    index('idx_pet_playdates_status').on(table.status),
  ]
);

// Relations
export const petSpeciesRelations = relations(petSpecies, ({ many }) => ({
  pets: many(virtualPets),
  abilities: many(petAbilities),
}));

export const petAbilitiesRelations = relations(petAbilities, ({ one }) => ({
  species: one(petSpecies, {
    fields: [petAbilities.speciesId],
    references: [petSpecies.id],
  }),
}));

export const virtualPetsRelations = relations(virtualPets, ({ one, many }) => ({
  member: one(members, {
    fields: [virtualPets.memberId],
    references: [members.id],
  }),
  household: one(households, {
    fields: [virtualPets.householdId],
    references: [households.id],
  }),
  species: one(petSpecies, {
    fields: [virtualPets.speciesId],
    references: [petSpecies.id],
  }),
  events: many(petEvents),
  hostedPlaydates: many(petPlaydates, { relationName: 'hostPet' }),
  guestPlaydates: many(petPlaydates, { relationName: 'guestPet' }),
}));

export const petEventsRelations = relations(petEvents, ({ one }) => ({
  pet: one(virtualPets, {
    fields: [petEvents.petId],
    references: [virtualPets.id],
  }),
  member: one(members, {
    fields: [petEvents.memberId],
    references: [members.id],
  }),
}));

export const petPlaydatesRelations = relations(petPlaydates, ({ one }) => ({
  hostPet: one(virtualPets, {
    fields: [petPlaydates.hostPetId],
    references: [virtualPets.id],
    relationName: 'hostPet',
  }),
  guestPet: one(virtualPets, {
    fields: [petPlaydates.guestPetId],
    references: [virtualPets.id],
    relationName: 'guestPet',
  }),
}));
