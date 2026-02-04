import { pgTable, varchar, timestamp, index, text, jsonb } from 'drizzle-orm/pg-core';

/**
 * Webhook events table for idempotency tracking.
 * Stores processed webhook event IDs to prevent duplicate processing.
 */
export const webhookEvents = pgTable(
  'webhook_events',
  {
    // The unique event ID from the webhook provider (e.g., Stripe event ID)
    eventId: varchar('event_id', { length: 255 }).primaryKey(),
    // The provider (stripe, revenuecat, etc.)
    provider: varchar('provider', { length: 50 }).notNull(),
    // The event type (e.g., checkout.session.completed)
    eventType: varchar('event_type', { length: 100 }).notNull(),
    // Processing status
    status: varchar('status', { length: 20 }).notNull().default('processed'),
    // Optional metadata for debugging
    metadata: jsonb('metadata'),
    // Error message if processing failed
    errorMessage: text('error_message'),
    // When the event was received and processed
    processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_webhook_events_provider').on(table.provider),
    index('idx_webhook_events_processed_at').on(table.processedAt),
  ]
);
