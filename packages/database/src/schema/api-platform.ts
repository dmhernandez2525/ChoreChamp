import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
  jsonb,
  unique,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { apiKeys } from './api-keys';
import { households } from './households';
import { members } from './members';

export const apiKeySettings = pgTable(
  'api_key_settings',
  {
    apiKeyId: uuid('api_key_id')
      .primaryKey()
      .references(() => apiKeys.id, { onDelete: 'cascade' }),
    scopes: text('scopes').array().notNull().default(['chores:read', 'members:read']),
    rateLimitPerMinute: integer('rate_limit_per_minute').notNull().default(120),
    requestsToday: integer('requests_today').notNull().default(0),
    lastRequestAt: timestamp('last_request_at', { withTimezone: true }),
    lastResetDate: date('last_reset_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_api_key_settings_last_request').on(table.lastRequestAt)]
);

export const apiKeyUsageEvents = pgTable(
  'api_key_usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    apiKeyId: uuid('api_key_id')
      .notNull()
      .references(() => apiKeys.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    requestPath: varchar('request_path', { length: 255 }).notNull(),
    requestMethod: varchar('request_method', { length: 10 }).notNull(),
    statusCode: integer('status_code').notNull(),
    responseTimeMs: integer('response_time_ms').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_api_key_usage_key_time').on(table.apiKeyId, table.createdAt),
    index('idx_api_key_usage_household_time').on(table.householdId, table.createdAt),
    index('idx_api_key_usage_path').on(table.requestPath),
  ]
);

export const webhookSubscriptions = pgTable(
  'webhook_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    createdByMemberId: uuid('created_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    targetUrl: text('target_url').notNull(),
    secretHash: text('secret_hash').notNull(),
    eventTypes: text('event_types').array().notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    failureCount: integer('failure_count').notNull().default(0),
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_webhook_subscriptions_household').on(table.householdId),
    index('idx_webhook_subscriptions_status').on(table.status),
  ]
);

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subscriptionId: uuid('subscription_id')
      .notNull()
      .references(() => webhookSubscriptions.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 80 }).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    responseStatus: integer('response_status'),
    responseBody: text('response_body'),
    attemptCount: integer('attempt_count').notNull().default(0),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_webhook_deliveries_subscription').on(table.subscriptionId, table.createdAt),
    index('idx_webhook_deliveries_household').on(table.householdId, table.createdAt),
    index('idx_webhook_deliveries_status').on(table.status),
  ]
);

export const oauthClients = pgTable(
  'oauth_clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    createdByMemberId: uuid('created_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 160 }).notNull(),
    clientId: varchar('client_id', { length: 80 }).notNull().unique(),
    clientSecretHash: text('client_secret_hash').notNull(),
    redirectUris: text('redirect_uris').array().notNull(),
    scopes: text('scopes').array().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_oauth_clients_household').on(table.householdId)]
);

export const oauthAuthorizationCodes = pgTable(
  'oauth_authorization_codes',
  {
    code: varchar('code', { length: 128 }).primaryKey(),
    oauthClientId: uuid('oauth_client_id')
      .notNull()
      .references(() => oauthClients.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    scopes: text('scopes').array().notNull(),
    redirectUri: text('redirect_uri').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_oauth_codes_client').on(table.oauthClientId, table.expiresAt)]
);

export const oauthAccessTokens = pgTable(
  'oauth_access_tokens',
  {
    tokenHash: text('token_hash').primaryKey(),
    oauthClientId: uuid('oauth_client_id')
      .notNull()
      .references(() => oauthClients.id, { onDelete: 'cascade' }),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    scopes: text('scopes').array().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_oauth_tokens_client').on(table.oauthClientId, table.expiresAt),
    index('idx_oauth_tokens_household').on(table.householdId, table.createdAt),
  ]
);

export const integrationMarketplaceApps = pgTable(
  'integration_marketplace_apps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull().unique(),
    name: varchar('name', { length: 160 }).notNull(),
    vendor: varchar('vendor', { length: 160 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 80 }).notNull(),
    websiteUrl: text('website_url'),
    installUrl: text('install_url'),
    logoUrl: text('logo_url'),
    pricingSummary: varchar('pricing_summary', { length: 140 }),
    isVerified: boolean('is_verified').notNull().default(false),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    supportedEventTypes: text('supported_event_types').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_marketplace_apps_status').on(table.status),
    index('idx_marketplace_apps_category').on(table.category),
  ]
);

export const integrationAppRequests = pgTable(
  'integration_app_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    appId: uuid('app_id')
      .notNull()
      .references(() => integrationMarketplaceApps.id, { onDelete: 'cascade' }),
    requestedByMemberId: uuid('requested_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
    reviewedByMemberId: uuid('reviewed_by_member_id').references(() => members.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewNote: text('review_note'),
    configuration: jsonb('configuration').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_integration_requests_household').on(table.householdId, table.requestedAt),
    index('idx_integration_requests_status').on(table.status),
    unique('unique_integration_request_per_household_app').on(table.householdId, table.appId),
  ]
);

export const apiSdkPackages = pgTable(
  'api_sdk_packages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    language: varchar('language', { length: 20 }).notNull(),
    packageName: varchar('package_name', { length: 160 }).notNull(),
    version: varchar('version', { length: 40 }).notNull(),
    repoUrl: text('repo_url').notNull(),
    docsUrl: text('docs_url').notNull(),
    installCommand: text('install_command').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_api_sdk_packages_language').on(table.language),
    unique('unique_api_sdk_package_language').on(table.language),
  ]
);

export const apiKeySettingsRelations = relations(apiKeySettings, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeySettings.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const apiKeyUsageEventsRelations = relations(apiKeyUsageEvents, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiKeyUsageEvents.apiKeyId],
    references: [apiKeys.id],
  }),
  household: one(households, {
    fields: [apiKeyUsageEvents.householdId],
    references: [households.id],
  }),
}));

export const webhookSubscriptionsRelations = relations(webhookSubscriptions, ({ one, many }) => ({
  household: one(households, {
    fields: [webhookSubscriptions.householdId],
    references: [households.id],
  }),
  creator: one(members, {
    fields: [webhookSubscriptions.createdByMemberId],
    references: [members.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  subscription: one(webhookSubscriptions, {
    fields: [webhookDeliveries.subscriptionId],
    references: [webhookSubscriptions.id],
  }),
  household: one(households, {
    fields: [webhookDeliveries.householdId],
    references: [households.id],
  }),
}));

export const oauthClientsRelations = relations(oauthClients, ({ one, many }) => ({
  household: one(households, {
    fields: [oauthClients.householdId],
    references: [households.id],
  }),
  creator: one(members, {
    fields: [oauthClients.createdByMemberId],
    references: [members.id],
  }),
  authCodes: many(oauthAuthorizationCodes),
  tokens: many(oauthAccessTokens),
}));

export const oauthAuthorizationCodesRelations = relations(
  oauthAuthorizationCodes,
  ({ one }) => ({
    client: one(oauthClients, {
      fields: [oauthAuthorizationCodes.oauthClientId],
      references: [oauthClients.id],
    }),
    household: one(households, {
      fields: [oauthAuthorizationCodes.householdId],
      references: [households.id],
    }),
    member: one(members, {
      fields: [oauthAuthorizationCodes.memberId],
      references: [members.id],
    }),
  })
);

export const oauthAccessTokensRelations = relations(oauthAccessTokens, ({ one }) => ({
  client: one(oauthClients, {
    fields: [oauthAccessTokens.oauthClientId],
    references: [oauthClients.id],
  }),
  household: one(households, {
    fields: [oauthAccessTokens.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [oauthAccessTokens.memberId],
    references: [members.id],
  }),
}));

export const integrationAppRequestsRelations = relations(integrationAppRequests, ({ one }) => ({
  app: one(integrationMarketplaceApps, {
    fields: [integrationAppRequests.appId],
    references: [integrationMarketplaceApps.id],
  }),
  household: one(households, {
    fields: [integrationAppRequests.householdId],
    references: [households.id],
  }),
  requestedBy: one(members, {
    fields: [integrationAppRequests.requestedByMemberId],
    references: [members.id],
  }),
  reviewedBy: one(members, {
    fields: [integrationAppRequests.reviewedByMemberId],
    references: [members.id],
  }),
}));
