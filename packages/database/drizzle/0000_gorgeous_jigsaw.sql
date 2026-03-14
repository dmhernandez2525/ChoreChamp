CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coppa_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"consent_type" varchar(50) NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"verification_metadata" text,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"active_household_id" uuid,
	"default_household_id" uuid,
	"theme" varchar(20) DEFAULT 'system',
	"notifications_enabled" boolean DEFAULT true,
	"email_digest_frequency" varchar(20) DEFAULT 'weekly',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false,
	"name" varchar(255),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_by" text NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"week_starts_on" smallint DEFAULT 0,
	"points_name" varchar(50) DEFAULT 'Stars',
	"currency" varchar(3) DEFAULT 'USD',
	"subscription_tier" varchar(20) DEFAULT 'free',
	"subscription_status" varchar(20) DEFAULT 'free',
	"subscription_expires_at" timestamp with time zone,
	"subscription_provider" varchar(20),
	"subscription_store" varchar(20),
	"subscription_billing_interval" varchar(10),
	"subscription_current_period_start" timestamp with time zone,
	"subscription_current_period_end" timestamp with time zone,
	"subscription_trial_ends_at" timestamp with time zone,
	"subscription_grace_period_ends_at" timestamp with time zone,
	"subscription_cancel_at_period_end" boolean DEFAULT false,
	"subscription_canceled_at" timestamp with time zone,
	"subscription_is_grandfathered" boolean DEFAULT false,
	"subscription_member_limit" integer DEFAULT 5,
	"stripe_customer_id" varchar(120),
	"stripe_subscription_id" varchar(120),
	"revenuecat_app_user_id" varchar(120),
	"theme_id" varchar(40) DEFAULT 'classic',
	"white_label_enabled" boolean DEFAULT false,
	"branding_name" varchar(120),
	"branding_logo_url" text,
	"total_chores_completed" integer DEFAULT 0,
	"current_family_streak" integer DEFAULT 0,
	"longest_family_streak" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"code" varchar(8) NOT NULL,
	"role" varchar(20) DEFAULT 'child',
	"created_by" text NOT NULL,
	"caregiver_permissions" jsonb,
	"expires_at" timestamp with time zone,
	"max_uses" integer,
	"use_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "invite_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "member_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_member_id" uuid NOT NULL,
	"primary_household_id" uuid NOT NULL,
	"linked_member_id" uuid NOT NULL,
	"linked_household_id" uuid NOT NULL,
	"share_points" boolean DEFAULT false,
	"share_streaks" boolean DEFAULT false,
	"share_badges" boolean DEFAULT false,
	"share_chore_view" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"approved_by_primary_household" boolean DEFAULT false,
	"approved_by_linked_household" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_households" (
	"user_id" text NOT NULL,
	"household_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"user_id" text,
	"name" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"color" varchar(7) NOT NULL,
	"avatar_url" text,
	"birth_year" smallint,
	"points_current" integer DEFAULT 0,
	"points_lifetime" integer DEFAULT 0,
	"streak_current" integer DEFAULT 0,
	"streak_longest" integer DEFAULT 0,
	"streak_last_completed_date" date,
	"streak_freezes_available" integer DEFAULT 1,
	"streak_freezes_used" integer DEFAULT 0,
	"badges" text[] DEFAULT '{}',
	"can_redeem_rewards" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT true,
	"caregiver_permissions" jsonb,
	"linked_member_id" uuid,
	"cross_household_settings" jsonb,
	"last_reminder_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_user_household" UNIQUE("household_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chore_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"category" varchar(50) NOT NULL,
	"point_value" integer DEFAULT 10,
	"difficulty" varchar(20) DEFAULT 'medium',
	"estimated_minutes" integer,
	"min_age" integer,
	"max_age" integer,
	"steps" jsonb,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "chores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"icon" varchar(50) DEFAULT '✅',
	"category" varchar(50) DEFAULT 'general',
	"point_value" integer DEFAULT 10 NOT NULL,
	"difficulty" varchar(20) DEFAULT 'medium',
	"assigned_to" uuid[] DEFAULT '{}',
	"assignment_type" varchar(20) DEFAULT 'specific',
	"rotation_index" integer DEFAULT 0,
	"recurrence_type" varchar(20) DEFAULT 'once',
	"recurrence_days" integer[],
	"recurrence_interval" integer,
	"recurrence_after_days" integer,
	"start_date" date DEFAULT now() NOT NULL,
	"end_date" date,
	"due_time" time,
	"time_window_minutes" integer,
	"requires_approval" boolean DEFAULT false,
	"requires_photo" boolean DEFAULT false,
	"estimated_minutes" integer,
	"priority" varchar(20) DEFAULT 'medium',
	"board_order" integer DEFAULT 0,
	"show_timer" boolean DEFAULT false,
	"steps" jsonb,
	"created_by" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_template" boolean DEFAULT false,
	"template_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chore_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"photo_url" text,
	"points_awarded" integer DEFAULT 0,
	"streak_day" integer,
	"started_at" timestamp with time zone,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chore_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"scheduled_date" date NOT NULL,
	"assigned_to" uuid NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completion_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_chore_date_member" UNIQUE("chore_id","scheduled_date","assigned_to")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"category" varchar(20) NOT NULL,
	"rarity" varchar(20) NOT NULL,
	"criteria_type" varchar(50) NOT NULL,
	"criteria_threshold" integer NOT NULL,
	"criteria_timeframe" varchar(20),
	"is_hidden" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "boss_battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"health_max" integer NOT NULL,
	"health_current" integer NOT NULL,
	"point_reward" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"ends_at" timestamp with time zone NOT NULL,
	"defeated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"health_current" integer DEFAULT 100,
	"health_max" integer DEFAULT 100,
	"weekly_goal" integer DEFAULT 500,
	"weekly_progress" integer DEFAULT 0,
	"week_started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "family_parties_household_id_unique" UNIQUE("household_id")
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reward_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"points_spent" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"requested_at" timestamp with time zone DEFAULT now(),
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"fulfilled_by" uuid,
	"fulfilled_at" timestamp with time zone,
	"rejected_by" uuid,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"icon" varchar(50) DEFAULT '🎁',
	"type" varchar(50) DEFAULT 'custom',
	"point_cost" integer NOT NULL,
	"created_by" uuid NOT NULL,
	"quantity" integer,
	"quantity_remaining" integer,
	"is_active" boolean DEFAULT true,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"sender_member_id" uuid,
	"sender_role" varchar(20) DEFAULT 'member',
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"subject" varchar(150) NOT NULL,
	"status" varchar(20) DEFAULT 'open',
	"priority" varchar(20) DEFAULT 'standard',
	"last_message_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(12) NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_key_settings" (
	"api_key_id" uuid PRIMARY KEY NOT NULL,
	"scopes" text[] DEFAULT '{"chores:read","members:read"}' NOT NULL,
	"rate_limit_per_minute" integer DEFAULT 120 NOT NULL,
	"requests_today" integer DEFAULT 0 NOT NULL,
	"last_request_at" timestamp with time zone,
	"last_reset_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_key_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"request_path" varchar(255) NOT NULL,
	"request_method" varchar(10) NOT NULL,
	"status_code" integer NOT NULL,
	"response_time_ms" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_sdk_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" varchar(20) NOT NULL,
	"package_name" varchar(160) NOT NULL,
	"version" varchar(40) NOT NULL,
	"repo_url" text NOT NULL,
	"docs_url" text NOT NULL,
	"install_command" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_api_sdk_package_language" UNIQUE("language")
);
--> statement-breakpoint
CREATE TABLE "integration_app_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"app_id" uuid NOT NULL,
	"requested_by_member_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now(),
	"reviewed_by_member_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"configuration" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_integration_request_per_household_app" UNIQUE("household_id","app_id")
);
--> statement-breakpoint
CREATE TABLE "integration_marketplace_apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"vendor" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(80) NOT NULL,
	"website_url" text,
	"install_url" text,
	"logo_url" text,
	"pricing_summary" varchar(140),
	"is_verified" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"supported_event_types" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "integration_marketplace_apps_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "oauth_access_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"oauth_client_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"scopes" text[] NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oauth_authorization_codes" (
	"code" varchar(128) PRIMARY KEY NOT NULL,
	"oauth_client_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"scopes" text[] NOT NULL,
	"redirect_uri" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oauth_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"client_id" varchar(80) NOT NULL,
	"client_secret_hash" text NOT NULL,
	"redirect_uris" text[] NOT NULL,
	"scopes" text[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "oauth_clients_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"response_status" integer,
	"response_body" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"target_url" text NOT NULL,
	"secret_hash" text NOT NULL,
	"event_types" text[] NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_catalog_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(80) NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text NOT NULL,
	"item_type" varchar(40) NOT NULL,
	"category" varchar(40) NOT NULL,
	"icon" varchar(20),
	"base_coin_price" integer DEFAULT 0 NOT NULL,
	"base_point_price" integer DEFAULT 0 NOT NULL,
	"sale_percent" integer DEFAULT 0 NOT NULL,
	"is_limited_time" boolean DEFAULT false NOT NULL,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"max_purchases_per_member" integer,
	"requires_parent_approval" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "store_catalog_items_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "store_gift_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"code" varchar(32) NOT NULL,
	"tier" varchar(20) NOT NULL,
	"duration_months" integer DEFAULT 1 NOT NULL,
	"recipient_email" text,
	"message" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"redeemed_by_member_id" uuid,
	"redeemed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "store_gift_cards_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "store_member_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"entitlement_type" varchar(40) NOT NULL,
	"reference_id" varchar(120) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_store_entitlement" UNIQUE("member_id","entitlement_type","reference_id")
);
--> statement-breakpoint
CREATE TABLE "store_purchase_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"require_parent_approval" boolean DEFAULT true NOT NULL,
	"require_pin_for_purchases" boolean DEFAULT false NOT NULL,
	"pin_hash" text,
	"daily_coin_limit" integer DEFAULT 5000 NOT NULL,
	"daily_point_limit" integer DEFAULT 2000 NOT NULL,
	"allow_gift_cards" boolean DEFAULT true NOT NULL,
	"allow_limited_time_offers" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "store_purchase_controls_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "store_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"catalog_item_id" uuid,
	"purchase_type" varchar(20) DEFAULT 'catalog' NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"coins_spent" integer DEFAULT 0 NOT NULL,
	"points_spent" integer DEFAULT 0 NOT NULL,
	"coins_granted" integer DEFAULT 0 NOT NULL,
	"status" varchar(40) DEFAULT 'completed' NOT NULL,
	"receipt_number" varchar(60) NOT NULL,
	"receipt_data" jsonb,
	"approved_by_member_id" uuid,
	"approved_at" timestamp with time zone,
	"purchased_at" timestamp with time zone DEFAULT now(),
	"refunded_at" timestamp with time zone,
	CONSTRAINT "store_purchases_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "store_refund_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now(),
	"resolved_at" timestamp with time zone,
	"resolved_by_member_id" uuid,
	"resolution_note" text,
	CONSTRAINT "unique_store_refund_request_per_purchase" UNIQUE("purchase_id")
);
--> statement-breakpoint
CREATE TABLE "store_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"chore_coins_balance" integer DEFAULT 0 NOT NULL,
	"lifetime_coins_purchased" integer DEFAULT 0 NOT NULL,
	"lifetime_coins_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "store_wallets_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "enterprise_admin_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"school_id" uuid,
	"actor_member_id" uuid,
	"event_type" varchar(120) NOT NULL,
	"target_type" varchar(80),
	"target_id" varchar(120),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_member_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'assigned' NOT NULL,
	"evidence_note" text,
	"score" integer,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewer_member_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_enterprise_submission_student_assignment" UNIQUE("assignment_id","student_member_id")
);
--> statement-breakpoint
CREATE TABLE "enterprise_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"classroom_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"assignment_type" varchar(20) DEFAULT 'task' NOT NULL,
	"due_at" timestamp with time zone,
	"points" integer DEFAULT 25 NOT NULL,
	"requires_proof" boolean DEFAULT false NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_bulk_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"classroom_id" uuid,
	"import_type" varchar(20) NOT NULL,
	"source_file_name" varchar(255),
	"row_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"imported_by_member_id" uuid NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_challenge_participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"classroom_id" uuid,
	"student_member_id" uuid,
	"progress" double precision DEFAULT 0 NOT NULL,
	"rank" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"challenge_type" varchar(20) DEFAULT 'school' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reward_points" integer DEFAULT 250 NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_by_member_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_classroom_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"classroom_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"student_number" varchar(60),
	"visibility_mode_override" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_enterprise_classroom_student" UNIQUE("classroom_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "enterprise_classrooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"grade_level" varchar(40) NOT NULL,
	"section" varchar(20),
	"subject" varchar(80),
	"teacher_member_id" uuid,
	"external_class_id" varchar(120),
	"lms_provider" varchar(32),
	"lms_course_id" varchar(120),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_districts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"code" varchar(32),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_enterprise_district_code" UNIQUE("household_id","code")
);
--> statement-breakpoint
CREATE TABLE "enterprise_lms_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"sync_enabled" boolean DEFAULT false NOT NULL,
	"external_tenant_id" varchar(180),
	"client_id" varchar(180),
	"configuration" jsonb,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_enterprise_lms_per_school" UNIQUE("school_id","provider")
);
--> statement-breakpoint
CREATE TABLE "enterprise_parent_visibility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"student_member_id" uuid NOT NULL,
	"visibility_mode" varchar(20) DEFAULT 'summary' NOT NULL,
	"allow_teacher_messages" boolean DEFAULT true NOT NULL,
	"allow_challenge_visibility" boolean DEFAULT true NOT NULL,
	"updated_by_member_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_enterprise_parent_visibility" UNIQUE("school_id","student_member_id")
);
--> statement-breakpoint
CREATE TABLE "enterprise_schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"district_id" uuid,
	"name" varchar(180) NOT NULL,
	"school_type" varchar(32) DEFAULT 'other' NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/New_York' NOT NULL,
	"branding_name" varchar(180),
	"branding_logo_url" text,
	"branding_primary_color" varchar(20),
	"ferpa_mode_enabled" boolean DEFAULT true NOT NULL,
	"coppa_mode_enabled" boolean DEFAULT true NOT NULL,
	"parent_visibility_default" varchar(20) DEFAULT 'summary' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"platform" varchar(20) NOT NULL,
	"device_name" varchar(100),
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "device_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"notification_type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"data" jsonb,
	"platform" varchar(20),
	"status" varchar(20) DEFAULT 'pending',
	"sent_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"push_enabled" boolean DEFAULT true,
	"chore_reminders" boolean DEFAULT true,
	"streak_reminders" boolean DEFAULT true,
	"approval_requests" boolean DEFAULT true,
	"family_updates" boolean DEFAULT true,
	"celebrations" boolean DEFAULT true,
	"weekly_summary" boolean DEFAULT true,
	"quiet_hours_enabled" boolean DEFAULT true,
	"quiet_hours_start" time DEFAULT '21:00',
	"quiet_hours_end" time DEFAULT '08:00',
	"max_daily_notifications" integer DEFAULT 10,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_user_prefs" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "chore_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"initiator_member_id" uuid NOT NULL,
	"recipient_member_id" uuid NOT NULL,
	"offered_chore_schedule_id" uuid NOT NULL,
	"requested_chore_schedule_id" uuid,
	"points_offered" integer DEFAULT 0 NOT NULL,
	"points_requested" integer DEFAULT 0 NOT NULL,
	"message" text,
	"status" varchar(30) DEFAULT 'pending_recipient' NOT NULL,
	"recipient_responded_at" timestamp with time zone,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "allowance_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"settings_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"points_converted" integer NOT NULL,
	"amount_due" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"paid_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "allowance_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"points_per_dollar" integer DEFAULT 100 NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payout_frequency" varchar(20) DEFAULT 'weekly' NOT NULL,
	"payout_day_of_week" integer,
	"payout_day_of_month" integer,
	"minimum_payout" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"maximum_payout" numeric(10, 2),
	"reserve_points" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "avatar_items" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"category" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"icon" varchar(200),
	"rarity" varchar(20) DEFAULT 'common' NOT NULL,
	"unlock_type" varchar(20) DEFAULT 'default' NOT NULL,
	"unlock_level" integer,
	"unlock_achievement_id" varchar(50),
	"unlock_seasonal_event_id" varchar(50),
	"unlock_cost" integer,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "character_classes" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"primary_stat" varchar(20) NOT NULL,
	"color" varchar(7) NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "character_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"class_id" varchar(50) NOT NULL,
	"class_changed_at" timestamp with time zone,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"xp_lifetime" integer DEFAULT 0 NOT NULL,
	"stat_speed" integer DEFAULT 5 NOT NULL,
	"stat_quality" integer DEFAULT 5 NOT NULL,
	"stat_consistency" integer DEFAULT 5 NOT NULL,
	"stat_teamwork" integer DEFAULT 5 NOT NULL,
	"stat_points_available" integer DEFAULT 0 NOT NULL,
	"avatar" jsonb NOT NULL,
	"unlocked_items" text[] DEFAULT '{}',
	"titles" text[] DEFAULT '{}',
	"active_title" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "character_profiles_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "character_skills" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"class_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"level_required" integer DEFAULT 1 NOT NULL,
	"effects" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "member_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"skill_id" varchar(50) NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now(),
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "xp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pet_abilities" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"species_id" varchar(50),
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"ability_type" varchar(30) NOT NULL,
	"value" integer NOT NULL,
	"cooldown_hours" integer DEFAULT 24 NOT NULL,
	"unlock_tier" varchar(20) DEFAULT 'baby' NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "pet_accessories" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(200),
	"category" varchar(30) NOT NULL,
	"rarity" varchar(20) DEFAULT 'common' NOT NULL,
	"unlock_type" varchar(20) DEFAULT 'default' NOT NULL,
	"unlock_level" integer,
	"unlock_achievement_id" varchar(50),
	"unlock_cost" integer,
	"stat_bonus" jsonb,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "pet_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"event_type" varchar(30) NOT NULL,
	"description" text,
	"data" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pet_playdates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_pet_id" uuid NOT NULL,
	"guest_pet_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"bonus_awarded" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pet_species" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"base_stats" jsonb NOT NULL,
	"evolution_path" jsonb NOT NULL,
	"special_ability" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "virtual_pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"species_id" varchar(50) NOT NULL,
	"evolution_tier" varchar(20) DEFAULT 'baby' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"stat_health" integer DEFAULT 100 NOT NULL,
	"stat_max_health" integer DEFAULT 100 NOT NULL,
	"stat_happiness" integer DEFAULT 100 NOT NULL,
	"stat_max_happiness" integer DEFAULT 100 NOT NULL,
	"stat_energy" integer DEFAULT 100 NOT NULL,
	"stat_max_energy" integer DEFAULT 100 NOT NULL,
	"mood" varchar(20) DEFAULT 'happy' NOT NULL,
	"equipped_accessories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unlocked_accessories" text[] DEFAULT '{}',
	"active_ability_id" varchar(50),
	"ability_last_used_at" timestamp with time zone,
	"last_fed_at" timestamp with time zone,
	"last_played_at" timestamp with time zone,
	"last_petted_at" timestamp with time zone,
	"last_stats_decay_at" timestamp with time zone DEFAULT now(),
	"consecutive_days_healthy" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_game_nights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"host_member_id" uuid NOT NULL,
	"bonus_multiplier" integer DEFAULT 150 NOT NULL,
	"total_games_played" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "family_night_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_night_id" uuid NOT NULL,
	"game_id" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"session_id" uuid,
	"winner_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_night_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_night_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"games_won" integer DEFAULT 0 NOT NULL,
	"is_ready" boolean DEFAULT false,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" varchar(50) NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"time_limit" integer DEFAULT 0 NOT NULL,
	"target_score" integer DEFAULT 100 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"xp_multiplier" integer DEFAULT 100 NOT NULL,
	"point_multiplier" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" varchar(50) NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"session_id" uuid,
	"difficulty" varchar(20) NOT NULL,
	"score" integer NOT NULL,
	"time_elapsed" integer NOT NULL,
	"accuracy" integer DEFAULT 100 NOT NULL,
	"combo" integer DEFAULT 0 NOT NULL,
	"stars" integer DEFAULT 1 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"is_perfect" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" varchar(50) NOT NULL,
	"household_id" uuid NOT NULL,
	"difficulty" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"current_round" integer DEFAULT 1 NOT NULL,
	"total_rounds" integer DEFAULT 1 NOT NULL,
	"game_state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"family_night_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_unlocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" varchar(50) NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now(),
	"high_score" integer DEFAULT 0 NOT NULL,
	"play_count" integer DEFAULT 0 NOT NULL,
	"total_xp_earned" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"last_played_at" timestamp with time zone,
	"best_difficulty" varchar(20) DEFAULT 'easy',
	"best_time" integer,
	"perfect_games" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mini_games" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(30) NOT NULL,
	"icon" varchar(50) NOT NULL,
	"thumbnail" varchar(200) NOT NULL,
	"min_players" integer DEFAULT 1 NOT NULL,
	"max_players" integer DEFAULT 1 NOT NULL,
	"estimated_duration" integer DEFAULT 5 NOT NULL,
	"base_xp_reward" integer DEFAULT 10 NOT NULL,
	"base_point_reward" integer DEFAULT 5 NOT NULL,
	"unlock_type" varchar(30) DEFAULT 'default' NOT NULL,
	"unlock_value" integer,
	"unlock_achievement_id" varchar(50),
	"instructions" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"is_host" boolean DEFAULT false,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "card_packs" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"pack_type" varchar(20) NOT NULL,
	"artwork" text NOT NULL,
	"card_count" smallint DEFAULT 5 NOT NULL,
	"point_cost" integer NOT NULL,
	"coin_cost" integer,
	"guaranteed_rarity" varchar(20),
	"rarity_weights" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "card_rewards" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"reward_type" varchar(30) NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"card_id" varchar(100),
	"pack_id" varchar(50),
	"rarity" varchar(20),
	"quantity" smallint DEFAULT 1,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "card_sets" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"theme" varchar(50) NOT NULL,
	"total_cards" smallint NOT NULL,
	"release_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"bonus_effect" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "card_showcases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"title" varchar(100) DEFAULT 'My Collection',
	"card_ids" text[] DEFAULT '{}',
	"layout" varchar(20) DEFAULT 'grid',
	"is_public" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "card_showcases_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "card_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"initiator_member_id" uuid NOT NULL,
	"target_member_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"offered_cards" jsonb NOT NULL,
	"requested_cards" jsonb NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"responded_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"card_id" varchar(100) NOT NULL,
	"priority" smallint DEFAULT 5,
	"added_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_wishlist_card" UNIQUE("member_id","card_id")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"flavor_text" text,
	"category" varchar(30) NOT NULL,
	"rarity" varchar(20) NOT NULL,
	"artwork" text NOT NULL,
	"border_color" varchar(7) NOT NULL,
	"effect" jsonb,
	"set_id" varchar(50) NOT NULL,
	"set_number" smallint NOT NULL,
	"total_in_set" smallint NOT NULL,
	"points_value" integer DEFAULT 10,
	"is_active" boolean DEFAULT true,
	"released_at" timestamp with time zone DEFAULT now(),
	"retired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_card_in_set" UNIQUE("set_id","set_number")
);
--> statement-breakpoint
CREATE TABLE "collection_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"total_cards_owned" integer DEFAULT 0,
	"unique_cards_owned" integer DEFAULT 0,
	"favorite_count" integer DEFAULT 0,
	"packs_opened" integer DEFAULT 0,
	"trades_completed" integer DEFAULT 0,
	"rarity_counts" jsonb DEFAULT '{}'::jsonb,
	"category_counts" jsonb DEFAULT '{}'::jsonb,
	"last_updated" timestamp with time zone DEFAULT now(),
	CONSTRAINT "collection_stats_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "owned_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" varchar(100) NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_favorite" boolean DEFAULT false,
	"is_new" boolean DEFAULT true,
	"first_obtained_at" timestamp with time zone DEFAULT now(),
	"last_obtained_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_owned_card" UNIQUE("card_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "pack_openings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pack_id" varchar(50) NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"points_spent" integer NOT NULL,
	"cards_received" jsonb NOT NULL,
	"new_cards_count" smallint NOT NULL,
	"duplicate_cards_count" smallint NOT NULL,
	"highest_rarity" varchar(20) NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "set_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"set_id" varchar(50) NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now(),
	"bonus_claimed" boolean DEFAULT false,
	CONSTRAINT "unique_set_completion" UNIQUE("member_id","set_id")
);
--> statement-breakpoint
CREATE TABLE "chapter_characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" varchar(50) NOT NULL,
	"character_id" varchar(50) NOT NULL,
	"role" varchar(30) DEFAULT 'supporting',
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "unique_chapter_character" UNIQUE("chapter_id","character_id")
);
--> statement-breakpoint
CREATE TABLE "member_chapter_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"chapter_id" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'locked' NOT NULL,
	"quests_completed" integer DEFAULT 0,
	"stars_earned" smallint DEFAULT 0,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"best_time" integer,
	"play_count" integer DEFAULT 0,
	CONSTRAINT "unique_member_chapter" UNIQUE("member_id","chapter_id")
);
--> statement-breakpoint
CREATE TABLE "member_quest_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"quest_id" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'locked' NOT NULL,
	"objective_progress" jsonb DEFAULT '[]'::jsonb,
	"current_dialogue_id" varchar(50),
	"dialogues_viewed" text[] DEFAULT '{}',
	"choices_made" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"time_spent" integer DEFAULT 0,
	CONSTRAINT "unique_member_quest" UNIQUE("member_id","quest_id")
);
--> statement-breakpoint
CREATE TABLE "member_story_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"current_chapter_id" varchar(50),
	"current_quest_id" varchar(50),
	"chapters_completed" integer DEFAULT 0,
	"quests_completed" integer DEFAULT 0,
	"total_play_time" integer DEFAULT 0,
	"choices_made" integer DEFAULT 0,
	"unlocked_characters" text[] DEFAULT '{}',
	"earned_titles" text[] DEFAULT '{}',
	"last_played_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "member_story_progress_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "member_unlocked_characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"character_id" varchar(50) NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now(),
	"unlocked_by" varchar(50),
	CONSTRAINT "unique_member_character_unlock" UNIQUE("member_id","character_id")
);
--> statement-breakpoint
CREATE TABLE "story_chapters" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"number" smallint NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"artwork" text NOT NULL,
	"theme" varchar(50) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'medium' NOT NULL,
	"required_level" smallint DEFAULT 1,
	"prerequisite_chapter_id" varchar(50),
	"rewards" jsonb NOT NULL,
	"estimated_duration" integer DEFAULT 30,
	"is_active" boolean DEFAULT true,
	"released_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_characters" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"avatar" text NOT NULL,
	"personality" text NOT NULL,
	"unlock_condition" text,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_dialogues" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"quest_id" varchar(50) NOT NULL,
	"order_in_quest" smallint NOT NULL,
	"trigger_type" varchar(30) NOT NULL,
	"trigger_id" varchar(50),
	"lines" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_quests" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"chapter_id" varchar(50) NOT NULL,
	"order_in_chapter" smallint NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"briefing" text NOT NULL,
	"debriefing" text NOT NULL,
	"objectives" jsonb NOT NULL,
	"rewards" jsonb NOT NULL,
	"time_limit" integer,
	"is_optional" boolean DEFAULT false,
	"is_bonus_quest" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_quest_order" UNIQUE("chapter_id","order_in_chapter")
);
--> statement-breakpoint
CREATE TABLE "automation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automation_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trigger_data" jsonb DEFAULT '{}'::jsonb,
	"actions_executed" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(20) NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "chore_zone_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"zone_name" varchar(100) NOT NULL,
	"device_ids" uuid[] DEFAULT '{}',
	"chore_categories" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"activity_type" varchar(30) NOT NULL,
	"previous_state" jsonb,
	"new_state" jsonb,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"duration" integer,
	"chore_id" uuid
);
--> statement-breakpoint
CREATE TABLE "smart_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hub_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(30) NOT NULL,
	"manufacturer" varchar(100),
	"model" varchar(100),
	"location" varchar(100),
	"capabilities" text[] DEFAULT '{}',
	"current_state" jsonb DEFAULT '{}'::jsonb,
	"is_online" boolean DEFAULT false,
	"last_seen_at" timestamp with time zone,
	"chore_related_zone" varchar(100),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "smart_home_automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true,
	"trigger" jsonb NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb,
	"actions" jsonb NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"trigger_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "smart_home_hubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"platform" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"host_url" text,
	"encrypted_credentials" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"last_connected_at" timestamp with time zone,
	"last_error" text,
	"capabilities" text[] DEFAULT '{}',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cleanliness_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"zone_name" text NOT NULL,
	"overall_score" integer DEFAULT 100 NOT NULL,
	"dust_level" real,
	"humidity_level" real,
	"last_motion_at" timestamp,
	"last_cleaned_at" timestamp,
	"suggested_chores" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detection_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"chore_type" text NOT NULL,
	"zone_name" text,
	"sensor_data" jsonb NOT NULL,
	"confidence" integer NOT NULL,
	"was_confirmed" boolean,
	"confirmed_by" uuid,
	"linked_chore_completion_id" uuid,
	"feedback_note" text,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "detection_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"chore_type" text NOT NULL,
	"zone_name" text NOT NULL,
	"typical_duration" integer,
	"typical_time_of_day" text,
	"typical_day_of_week" jsonb,
	"typical_member_id" uuid,
	"total_detections" integer DEFAULT 0 NOT NULL,
	"confirmed_detections" integer DEFAULT 0 NOT NULL,
	"false_positives" integer DEFAULT 0 NOT NULL,
	"accuracy_rate" real DEFAULT 0 NOT NULL,
	"sensor_signatures" jsonb DEFAULT '[]'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detection_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"device_id" uuid NOT NULL,
	"sensor_type" text NOT NULL,
	"conditions" jsonb NOT NULL,
	"condition_logic" text DEFAULT 'all' NOT NULL,
	"chore_type" text NOT NULL,
	"linked_chore_id" uuid,
	"zone_name" text,
	"detection_mode" text NOT NULL,
	"completion_confidence" integer DEFAULT 80 NOT NULL,
	"require_manual_confirm" boolean DEFAULT false NOT NULL,
	"cooldown_minutes" integer DEFAULT 60 NOT NULL,
	"need_threshold" real,
	"need_check_interval" integer,
	"bonus_points_on_auto_detect" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sensor_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"sensor_type" text NOT NULL,
	"attribute" text NOT NULL,
	"value_numeric" real,
	"value_text" text,
	"value_boolean" boolean,
	"unit" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkpoint_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"checkpoint_group_id" text NOT NULL,
	"chore_id" uuid,
	"total_checkpoints" integer NOT NULL,
	"completed_checkpoints" integer DEFAULT 0 NOT NULL,
	"completed_checkpoint_ids" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"bonus_points_awarded" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qr_code_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"equipment_name" text NOT NULL,
	"checked_out_at" timestamp DEFAULT now() NOT NULL,
	"checked_in_at" timestamp,
	"status" text DEFAULT 'checked_out' NOT NULL,
	"due_at" timestamp,
	"checkout_notes" text,
	"checkin_notes" text,
	"condition_on_checkout" text DEFAULT 'good' NOT NULL,
	"condition_on_checkin" text
);
--> statement-breakpoint
CREATE TABLE "qr_code_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qr_code_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"scan_location" jsonb,
	"verification_status" text NOT NULL,
	"failure_reason" text,
	"photo_url" text,
	"photo_verified" boolean,
	"gps_verified" boolean,
	"gps_distance_meters" real,
	"chore_completion_id" uuid,
	"bonus_points_awarded" integer DEFAULT 0 NOT NULL,
	"device_info" jsonb
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"code_data" text NOT NULL,
	"code_url" text NOT NULL,
	"location_name" text,
	"latitude" real,
	"longitude" real,
	"radius_meters" real,
	"linked_chore_id" uuid,
	"linked_zone_name" text,
	"verification_requirement" text DEFAULT 'scan_only' NOT NULL,
	"requires_photo" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"checkpoint_order" integer,
	"checkpoint_group_id" text,
	"total_scans" integer DEFAULT 0 NOT NULL,
	"last_scanned_at" timestamp,
	"last_scanned_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "qr_codes_code_data_unique" UNIQUE("code_data")
);
--> statement-breakpoint
CREATE TABLE "away_mode_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"activated_at" timestamp,
	"reason" text,
	"pause_chore_deadlines" boolean DEFAULT true NOT NULL,
	"pause_streak_tracking" boolean DEFAULT false NOT NULL,
	"auto_reactivate_on_return" boolean DEFAULT true NOT NULL,
	"scheduled_end_at" timestamp,
	"expected_return_geofence_id" uuid,
	CONSTRAINT "away_mode_configs_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "geofence_automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"geofence_id" uuid NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_member_ids" jsonb,
	"require_all_members" boolean DEFAULT false NOT NULL,
	"require_min_dwell_minutes" integer,
	"time_conditions" jsonb,
	"actions" jsonb NOT NULL,
	"times_triggered" integer DEFAULT 0 NOT NULL,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"geofence_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"accuracy" real NOT NULL,
	"device_id" text,
	"battery_level" integer,
	"actions_triggered" jsonb DEFAULT '[]'::jsonb,
	"notification_sent" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "geofences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"radius_meters" real NOT NULL,
	"address" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"notify_on_entry" boolean DEFAULT false NOT NULL,
	"notify_on_exit" boolean DEFAULT true NOT NULL,
	"dwell_time_minutes" integer,
	"linked_zone_name" text,
	"linked_chore_ids" jsonb,
	"active_for_member_ids" jsonb,
	"active_hours_start" text,
	"active_hours_end" text,
	"active_days" jsonb,
	"total_entries" integer DEFAULT 0 NOT NULL,
	"total_exits" integer DEFAULT 0 NOT NULL,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"accuracy" real NOT NULL,
	"geofence_id" uuid,
	"geofence_name" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"tracking_mode" text DEFAULT 'geofence_only' NOT NULL,
	"share_location_with_household" boolean DEFAULT true NOT NULL,
	"allow_location_history" boolean DEFAULT true NOT NULL,
	"history_retention_days" integer DEFAULT 30 NOT NULL,
	"blur_location_when_not_home" boolean DEFAULT false NOT NULL,
	"hide_from_specific_members" jsonb,
	CONSTRAINT "location_settings_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "member_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"accuracy" real NOT NULL,
	"altitude" real,
	"speed" real,
	"heading" real,
	"current_geofence_id" uuid,
	"current_geofence_name" text,
	"entered_current_at" timestamp,
	"is_at_home" boolean DEFAULT false NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"device_id" text,
	"battery_level" integer,
	CONSTRAINT "member_locations_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "chore_screen_time_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"chore_id" uuid,
	"chore_name" text,
	"chore_category" text,
	"reward_type" text NOT NULL,
	"minutes_amount" integer NOT NULL,
	"require_perfect_completion" boolean DEFAULT false NOT NULL,
	"require_photo_proof" boolean DEFAULT false NOT NULL,
	"only_on_weekdays" boolean DEFAULT false NOT NULL,
	"max_per_day" integer,
	"max_per_week" integer,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_access_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"device_id" uuid,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"require_daily_chores" boolean DEFAULT false NOT NULL,
	"required_chore_ids" jsonb,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screen_time_extension_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"requested_minutes" integer NOT NULL,
	"reason" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"responded_by" uuid,
	"responded_at" timestamp,
	"response_note" text,
	"granted_minutes" integer
);
--> statement-breakpoint
CREATE TABLE "screen_time_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"daily_limit_minutes" integer DEFAULT 120 NOT NULL,
	"weekend_limit_minutes" integer,
	"allowed_start_time" text,
	"allowed_end_time" text,
	"bedtime_start" text,
	"bedtime_end" text,
	"day_limits" jsonb,
	"app_limits" jsonb,
	"allow_extensions" boolean DEFAULT true NOT NULL,
	"pause_on_school_days" boolean DEFAULT false NOT NULL,
	"require_chore_completion" boolean DEFAULT false NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "screen_time_limits_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "screen_time_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"reward_type" text NOT NULL,
	"minutes_amount" integer,
	"description" text NOT NULL,
	"earned_from" text NOT NULL,
	"source_id" uuid,
	"source_name" text,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screen_time_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_minutes_used" integer DEFAULT 0 NOT NULL,
	"limit_minutes" integer NOT NULL,
	"bonus_minutes_earned" integer DEFAULT 0 NOT NULL,
	"bonus_minutes_used" integer DEFAULT 0 NOT NULL,
	"device_usage" jsonb DEFAULT '[]'::jsonb,
	"app_usage" jsonb DEFAULT '[]'::jsonb,
	"limit_reached" boolean DEFAULT false NOT NULL,
	"limit_extended" boolean DEFAULT false NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"platform" text NOT NULL,
	"platform_device_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_connected" boolean DEFAULT false NOT NULL,
	"last_sync_at" timestamp,
	"icon_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"subject_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"instructions" text,
	"assignment_type" text DEFAULT 'homework' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"assigned_date" date,
	"due_date" timestamp NOT NULL,
	"completed_at" timestamp,
	"submitted_at" timestamp,
	"estimated_minutes" integer,
	"actual_minutes" integer,
	"max_points" integer,
	"earned_points" integer,
	"grade" text,
	"attachments" jsonb,
	"resource_links" jsonb,
	"points_awarded" integer,
	"screen_time_awarded" integer,
	"notes" text,
	"parent_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"subject_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"goal_type" text NOT NULL,
	"target_value" integer NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"period_type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"reward_points" integer,
	"reward_screen_time" integer,
	"reward_description" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"plan_type" text NOT NULL,
	"date" date NOT NULL,
	"end_date" date,
	"planned_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_planned_minutes" integer DEFAULT 0 NOT NULL,
	"total_completed_minutes" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"subject_id" uuid,
	"assignment_id" uuid,
	"reminder_type" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"scheduled_for" timestamp,
	"recurring_days" jsonb,
	"recurring_time" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_sent_at" timestamp,
	"snoozed_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"subject_id" uuid,
	"assignment_id" uuid,
	"session_type" text NOT NULL,
	"title" text,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"planned_duration_minutes" integer,
	"breaks_taken" integer DEFAULT 0 NOT NULL,
	"focus_score" integer,
	"accomplishments" text,
	"pages_covered" text,
	"problems_completed" integer,
	"productivity_rating" integer,
	"difficulty_rating" integer,
	"comprehension_rating" integer,
	"location" text,
	"study_method" text,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"bonus_points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_study_date" date,
	"weekly_minutes" integer DEFAULT 0 NOT NULL,
	"weekly_goal_minutes" integer DEFAULT 300 NOT NULL,
	"weekly_session_count" integer DEFAULT 0 NOT NULL,
	"monthly_minutes" integer DEFAULT 0 NOT NULL,
	"monthly_session_count" integer DEFAULT 0 NOT NULL,
	"total_minutes" integer DEFAULT 0 NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_assignments_completed" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "study_streaks_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"icon" text,
	"teacher_name" text,
	"room_number" text,
	"schedule" text,
	"target_grade" text,
	"current_grade" text,
	"notify_before_class" boolean DEFAULT false NOT NULL,
	"notify_minutes_before" integer DEFAULT 15 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chore_educational_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"questions_required" integer,
	"minimum_correct_percent" integer,
	"bonus_points_for_perfect" integer,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_session_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "educational_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"achievement_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"content_type" text,
	"threshold" integer NOT NULL,
	"value" integer NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "educational_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "educational_chore_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"content_type" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"timing" text DEFAULT 'after_chore' NOT NULL,
	"questions_required" integer DEFAULT 5 NOT NULL,
	"minimum_correct_percent" integer DEFAULT 70 NOT NULL,
	"time_limit" integer,
	"allow_retry" boolean DEFAULT true NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_delay" integer DEFAULT 5 NOT NULL,
	"bonus_points_for_perfect" integer DEFAULT 10 NOT NULL,
	"bonus_screen_time_minutes" integer,
	"min_age" integer,
	"max_age" integer,
	"grade_level" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "educational_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid,
	"content_type" text NOT NULL,
	"difficulty" text NOT NULL,
	"grade_level" text,
	"question" text NOT NULL,
	"question_type" text DEFAULT 'multiple_choice' NOT NULL,
	"options" jsonb,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"image_url" text,
	"audio_url" text,
	"topic" text,
	"subtopic" text,
	"tags" jsonb,
	"times_asked" integer DEFAULT 0 NOT NULL,
	"times_correct" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "educational_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"chore_id" uuid,
	"template_id" uuid,
	"content_type" text NOT NULL,
	"difficulty" text NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"total_questions" integer NOT NULL,
	"questions_answered" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"incorrect_answers" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"time_limit_minutes" integer,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"score_percent" integer,
	"passed" boolean,
	"minimum_required" integer NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"bonus_points_earned" integer DEFAULT 0 NOT NULL,
	"screen_time_earned" integer DEFAULT 0 NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"can_retry" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"content_type" text NOT NULL,
	"levels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"require_sequential" boolean DEFAULT true NOT NULL,
	"allow_skip_ahead" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_educational_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"progress_by_type" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_questions_answered" integer DEFAULT 0 NOT NULL,
	"total_correct" integer DEFAULT 0 NOT NULL,
	"overall_accuracy" integer DEFAULT 0 NOT NULL,
	"current_day_streak" integer DEFAULT 0 NOT NULL,
	"longest_day_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" timestamp,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"total_bonus_earned" integer DEFAULT 0 NOT NULL,
	"overall_level" integer DEFAULT 1 NOT NULL,
	"experience_points" integer DEFAULT 0 NOT NULL,
	"next_level_xp" integer DEFAULT 100 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "member_educational_progress_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "member_learning_path_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"path_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"highest_level_completed" integer DEFAULT 0 NOT NULL,
	"level_completions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_attempts" integer DEFAULT 0 NOT NULL,
	"total_time_minutes" integer DEFAULT 0 NOT NULL,
	"average_score" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"report_card_id" uuid,
	"achievement_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"school_year" text NOT NULL,
	"period_type" text,
	"period_number" integer,
	"bonus_earned" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"celebration_shown" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"goal_type" text NOT NULL,
	"target_value" real NOT NULL,
	"target_grade" text,
	"subject_id" uuid,
	"subject_name" text,
	"school_year" text NOT NULL,
	"period_type" text NOT NULL,
	"period_number" integer,
	"current_progress" real DEFAULT 0 NOT NULL,
	"is_achieved" boolean DEFAULT false NOT NULL,
	"achieved_at" timestamp,
	"bonus_on_achievement" integer DEFAULT 0 NOT NULL,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academic_trends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"subject_id" uuid,
	"subject_name" text,
	"metric_type" text NOT NULL,
	"school_year" text NOT NULL,
	"period_type" text NOT NULL,
	"period_number" integer NOT NULL,
	"value" real NOT NULL,
	"previous_value" real,
	"change_percent" real,
	"trend_direction" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"school_year" text NOT NULL,
	"period_type" text NOT NULL,
	"period_number" integer NOT NULL,
	"total_days" integer NOT NULL,
	"days_present" integer NOT NULL,
	"days_absent" integer DEFAULT 0 NOT NULL,
	"days_excused" integer DEFAULT 0 NOT NULL,
	"days_tardy" integer DEFAULT 0 NOT NULL,
	"attendance_percentage" real NOT NULL,
	"is_perfect" boolean DEFAULT false NOT NULL,
	"bonus_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_bonus_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"bonus_type" text NOT NULL,
	"grade_threshold" text,
	"gpa_threshold" real,
	"improvement_threshold" real,
	"bonus_points" integer NOT NULL,
	"bonus_multiplier" real DEFAULT 1 NOT NULL,
	"max_bonus_per_card" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grading_scales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"scale_type" text DEFAULT 'letter' NOT NULL,
	"grades" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "honor_roll_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"min_gpa" real NOT NULL,
	"requires_no_failing_grades" boolean DEFAULT true NOT NULL,
	"requires_perfect_attendance" boolean DEFAULT false NOT NULL,
	"bonus_points" integer NOT NULL,
	"badge_title" text NOT NULL,
	"badge_icon" text NOT NULL,
	"badge_color" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_card_grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_card_id" uuid NOT NULL,
	"subject_id" uuid,
	"subject_name" text NOT NULL,
	"letter_grade" text,
	"percentage_grade" real,
	"gpa_value" real,
	"credits" real,
	"teacher_comments" text,
	"previous_grade" text,
	"grade_improvement" real,
	"bonus_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"school_year" text NOT NULL,
	"period_type" text NOT NULL,
	"period_number" integer NOT NULL,
	"period_name" text NOT NULL,
	"issue_date" date NOT NULL,
	"image_url" text,
	"ocr_processed" boolean DEFAULT false NOT NULL,
	"ocr_raw_text" text,
	"gpa" real,
	"total_bonus_earned" integer DEFAULT 0 NOT NULL,
	"parent_acknowledged" boolean DEFAULT false NOT NULL,
	"parent_acknowledged_at" timestamp,
	"parent_acknowledged_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expert_tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"author_name" text,
	"source_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_challenge_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"current_progress" integer DEFAULT 0 NOT NULL,
	"target_progress" integer NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_skill_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"showcased" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_skill_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"status" text DEFAULT 'locked' NOT NULL,
	"mastery_level" text DEFAULT 'novice' NOT NULL,
	"current_xp" integer DEFAULT 0 NOT NULL,
	"practice_count" integer DEFAULT 0 NOT NULL,
	"total_practice_minutes" integer DEFAULT 0 NOT NULL,
	"last_practiced_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"mastered_at" timestamp,
	"mentor_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorship_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"mentee_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sessions_completed" integer DEFAULT 0 NOT NULL,
	"total_session_minutes" integer DEFAULT 0 NOT NULL,
	"mentor_xp_earned" integer DEFAULT 0 NOT NULL,
	"mentee_xp_earned" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid,
	"skill_tree_id" uuid,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text NOT NULL,
	"rarity" text DEFAULT 'common' NOT NULL,
	"requirement" text NOT NULL,
	"xp_value" integer DEFAULT 0 NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"certification_name" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"assessment_score" integer,
	"assessment_passing_score" integer DEFAULT 70 NOT NULL,
	"assessment_attempts" integer DEFAULT 0 NOT NULL,
	"certified_at" timestamp,
	"certified_by_id" uuid,
	"expires_at" timestamp,
	"certificate_url" text,
	"badge_icon_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"challenge_type" text NOT NULL,
	"difficulty" text NOT NULL,
	"requirements" jsonb NOT NULL,
	"xp_reward" integer NOT NULL,
	"bonus_reward" integer,
	"badge_reward" text,
	"time_limit" integer,
	"max_attempts" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_practice_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_skill_progress_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"chore_completion_id" uuid,
	"duration_minutes" integer NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"quality_rating" integer,
	"self_assessment" integer,
	"mentor_assessment" integer,
	"mentor_id" uuid,
	"mentor_feedback" text,
	"photo_proof_url" text,
	"notes" text,
	"practiced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_trees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"color_theme" text DEFAULT '#3b82f6' NOT NULL,
	"total_skills" integer DEFAULT 0 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_tree_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon_url" text,
	"level" integer DEFAULT 1 NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"xp_required" integer DEFAULT 100 NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"age_minimum" integer,
	"estimated_practice_time" integer DEFAULT 30 NOT NULL,
	"video_tutorial_url" text,
	"article_url" text,
	"tips" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"safety_notes" text,
	"linked_chore_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_core" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"title" text NOT NULL,
	"event_type" text NOT NULL,
	"event_date" date NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text,
	"location" text,
	"opponent" text,
	"is_home_game" boolean,
	"attendance_required" boolean DEFAULT true NOT NULL,
	"chore_exemption" boolean DEFAULT false NOT NULL,
	"notes" text,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"event_type" text DEFAULT 'practice' NOT NULL,
	"location" text,
	"is_recurring" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balance_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"recommendation_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"metrics" jsonb NOT NULL,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"class_name" text NOT NULL,
	"teacher_name" text,
	"room_number" text,
	"period_number" integer NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"color" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "college_prep_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" date,
	"completed_at" timestamp,
	"status" text DEFAULT 'not_started' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"related_college" text,
	"notes" text,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extracurricular_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"organization" text,
	"coach_name" text,
	"coach_contact" text,
	"location" text,
	"season" text DEFAULT 'year_round' NOT NULL,
	"season_start_date" date,
	"season_end_date" date,
	"commitment_level" text DEFAULT 'medium' NOT NULL,
	"weekly_hours" real DEFAULT 0 NOT NULL,
	"cost" real,
	"equipment_needed" jsonb,
	"chore_adjustment_percent" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"practice_date" date NOT NULL,
	"duration_minutes" integer NOT NULL,
	"practice_type" text NOT NULL,
	"intensity_level" integer NOT NULL,
	"skills_focused" jsonb,
	"notes" text,
	"coach_feedback" text,
	"self_rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"conflict_date" date NOT NULL,
	"conflict_type" text NOT NULL,
	"item1_type" text NOT NULL,
	"item1_id" text NOT NULL,
	"item1_name" text NOT NULL,
	"item2_type" text NOT NULL,
	"item2_id" text NOT NULL,
	"item2_name" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"school_name" text NOT NULL,
	"school_year" text NOT NULL,
	"grade_level" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"school_days" jsonb NOT NULL,
	"lunch_time" text,
	"break_times" jsonb,
	"imported_from" text,
	"last_synced_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"member_name" text NOT NULL,
	"position" text,
	"jersey_number" integer,
	"contact_email" text,
	"contact_phone" text,
	"parent_name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"organization_name" text NOT NULL,
	"activity_description" text NOT NULL,
	"volunteer_date" date NOT NULL,
	"hours_completed" real NOT NULL,
	"supervisor_name" text,
	"supervisor_contact" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verified_by" uuid,
	"certificate_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"event_id" varchar(255) PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'processed' NOT NULL,
	"metadata" jsonb,
	"error_message" text,
	"processed_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"category" varchar(32) DEFAULT 'all' NOT NULL,
	"target_minutes_per_day" integer DEFAULT 60 NOT NULL,
	"target_minutes_per_week" integer DEFAULT 300 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"category" varchar(32) NOT NULL,
	"activity_name" varchar(200) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"calories_estimate" integer,
	"note" text,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gratitude_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meal_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"meal_type" varchar(32) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"servings" integer DEFAULT 4,
	"prep_time_minutes" integer,
	"cook_time_minutes" integer,
	"calories" integer,
	"planned_date" timestamp with time zone NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mental_health_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"category" varchar(64) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"resource_url" text,
	"age_range" varchar(32),
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sleep_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"bedtime" timestamp with time zone NOT NULL,
	"wake_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"quality_score" integer,
	"note" text,
	"log_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wellness_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"mood_score" integer NOT NULL,
	"energy_score" integer NOT NULL,
	"stress_score" integer,
	"sleep_quality_score" integer,
	"note" text,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "advanced_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"report_type" varchar(32) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"config" jsonb NOT NULL,
	"schedule" varchar(32),
	"last_generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_name" varchar(200) NOT NULL,
	"action" varchar(64) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_id" uuid,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"scope" jsonb NOT NULL,
	"format" varchar(16) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"file_url" text,
	"file_size" integer,
	"include_attachments" boolean DEFAULT false NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "generated_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"format" varchar(16) NOT NULL,
	"file_url" text,
	"file_size" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"period" varchar(32) NOT NULL,
	"api_response_time_p50" integer DEFAULT 0 NOT NULL,
	"api_response_time_p95" integer DEFAULT 0 NOT NULL,
	"api_response_time_p99" integer DEFAULT 0 NOT NULL,
	"error_rate" integer DEFAULT 0 NOT NULL,
	"requests_per_minute" integer DEFAULT 0 NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"peak_concurrent_users" integer DEFAULT 0 NOT NULL,
	"database_query_time_avg" integer DEFAULT 0 NOT NULL,
	"cache_hit_rate" integer DEFAULT 0 NOT NULL,
	"uptime_percentage" integer DEFAULT 100 NOT NULL,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_event_participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"household_name" varchar(200) NOT NULL,
	"status" varchar(16) DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"location" text,
	"is_virtual" boolean DEFAULT false NOT NULL,
	"max_participants" integer,
	"current_participants" integer DEFAULT 0 NOT NULL,
	"organizer_household_id" uuid NOT NULL,
	"organizer_name" varchar(200) NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"category" varchar(32) NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "forum_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"parent_reply_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "friend_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_household_id" uuid NOT NULL,
	"requester_household_name" varchar(200) NOT NULL,
	"recipient_household_id" uuid NOT NULL,
	"recipient_household_name" varchar(200) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"message" text,
	"connected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_challenge_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"household_name" varchar(200) NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"challenge_type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'upcoming' NOT NULL,
	"target_value" integer NOT NULL,
	"metric" varchar(64) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"participant_count" integer DEFAULT 0 NOT NULL,
	"created_by_id" uuid NOT NULL,
	"prize" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"share_type" varchar(32) NOT NULL,
	"visibility" varchar(16) DEFAULT 'friends' NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"reference_id" uuid,
	"reference_type" varchar(64),
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_chore_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"source" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"suggested_member_id" text,
	"suggested_frequency" text,
	"suggested_points" integer DEFAULT 10 NOT NULL,
	"confidence" real NOT NULL,
	"reasoning" text NOT NULL,
	"is_accepted" boolean,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_execution_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" text NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"trigger_data" jsonb DEFAULT '{}' NOT NULL,
	"actions_executed" jsonb DEFAULT '[]' NOT NULL,
	"success" boolean NOT NULL,
	"duration" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"trigger" varchar(50) NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"action" varchar(50) NOT NULL,
	"action_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "natural_language_commands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"member_id" text NOT NULL,
	"input" text NOT NULL,
	"parsed_intent" text NOT NULL,
	"parsed_entities" jsonb DEFAULT '{}' NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"error" text,
	"confidence" real NOT NULL,
	"processing_time" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"type" text NOT NULL,
	"timeframe" text NOT NULL,
	"member_id" text,
	"prediction" jsonb DEFAULT '{}' NOT NULL,
	"confidence" real NOT NULL,
	"factors" jsonb DEFAULT '[]' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictive_analytics_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"enable_predictions" boolean DEFAULT true NOT NULL,
	"enabled_types" jsonb DEFAULT '[]' NOT NULL,
	"notify_on_critical" boolean DEFAULT true NOT NULL,
	"data_retention_days" integer DEFAULT 90 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictive_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"actionable" boolean DEFAULT false NOT NULL,
	"suggested_action" text,
	"member_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedule_optimizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"strategy" text NOT NULL,
	"original_score" real NOT NULL,
	"optimized_score" real NOT NULL,
	"improvement_percent" real NOT NULL,
	"conflicts" jsonb DEFAULT '[]' NOT NULL,
	"suggestions" jsonb DEFAULT '[]' NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smart_schedule_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"strategy" text DEFAULT 'balanced' NOT NULL,
	"max_chores_per_member_per_day" integer DEFAULT 5 NOT NULL,
	"respect_availability" boolean DEFAULT true NOT NULL,
	"balance_workload" boolean DEFAULT true NOT NULL,
	"consider_preferences" boolean DEFAULT true NOT NULL,
	"avoid_back_to_back" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggestion_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"enable_suggestions" boolean DEFAULT true NOT NULL,
	"sources" jsonb DEFAULT '[]' NOT NULL,
	"max_suggestions_per_week" integer DEFAULT 10 NOT NULL,
	"min_confidence" real DEFAULT 0.7 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "album_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" text NOT NULL,
	"household_id" text NOT NULL,
	"uploaded_by_id" text NOT NULL,
	"uploader_name" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"caption" text,
	"chore_id" text,
	"taken_at" timestamp,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"member_id" text NOT NULL,
	"provider" text NOT NULL,
	"calendar_id" text NOT NULL,
	"calendar_name" text NOT NULL,
	"sync_direction" text DEFAULT 'push' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"last_sync_at" timestamp,
	"sync_errors" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" text NOT NULL,
	"chore_id" text NOT NULL,
	"external_event_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"recurrence" text,
	"last_sync_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_sync_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"include_chore_details" boolean DEFAULT true NOT NULL,
	"include_assignee" boolean DEFAULT true NOT NULL,
	"include_points" boolean DEFAULT false NOT NULL,
	"reminder_minutes" integer DEFAULT 30 NOT NULL,
	"color_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'household' NOT NULL,
	"participant_ids" jsonb DEFAULT '[]' NOT NULL,
	"chore_id" text,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_name" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"reference_id" text,
	"is_edited" boolean DEFAULT false NOT NULL,
	"read_by" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_unlock_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" text NOT NULL,
	"household_id" text NOT NULL,
	"unlock_id" text NOT NULL,
	"current_progress" integer DEFAULT 0 NOT NULL,
	"is_unlocked" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp,
	"notified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "photo_albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_photo_url" text,
	"type" text DEFAULT 'general' NOT NULL,
	"photo_count" integer DEFAULT 0 NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progressive_unlocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"trigger" text NOT NULL,
	"threshold" integer NOT NULL,
	"icon_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"achievement_id" text NOT NULL,
	"platform" text NOT NULL,
	"shared_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"enable_sharing" boolean DEFAULT true NOT NULL,
	"default_card_style" text DEFAULT 'colorful' NOT NULL,
	"include_household_name" boolean DEFAULT false NOT NULL,
	"include_member_avatar" boolean DEFAULT true NOT NULL,
	"auto_share_badges" boolean DEFAULT false NOT NULL,
	"auto_share_streak_milestones" boolean DEFAULT false NOT NULL,
	"parent_approval_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shareable_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" text NOT NULL,
	"member_id" text NOT NULL,
	"member_name" text NOT NULL,
	"achievement_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"card_style" text DEFAULT 'colorful' NOT NULL,
	"share_url" text NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "allowance_deposit_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"banking_connection_id" uuid NOT NULL,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"frequency" text NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"next_scheduled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "allowance_deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"member_name" text NOT NULL,
	"banking_connection_id" uuid NOT NULL,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"processed_at" timestamp,
	"failure_reason" text,
	"external_transaction_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banking_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"parent_member_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"account_name" text NOT NULL,
	"account_mask" text NOT NULL,
	"institution_name" text NOT NULL,
	"encrypted_access_token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chore_chain_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" uuid NOT NULL,
	"chore_id" uuid NOT NULL,
	"chore_name" text NOT NULL,
	"step_order" integer NOT NULL,
	"dependency_type" text DEFAULT 'must_complete_before' NOT NULL,
	"depends_on_step_id" uuid,
	"assignee_id" uuid,
	"assignee_name" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chore_chains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_steps" integer DEFAULT 0 NOT NULL,
	"completed_steps" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"bonus_points" integer DEFAULT 0 NOT NULL,
	"deadline_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chore_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"household_id" uuid NOT NULL,
	"classification" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chore_rotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"chore_id" uuid NOT NULL,
	"chore_name" text NOT NULL,
	"rotation_type" text NOT NULL,
	"frequency" text NOT NULL,
	"participant_ids" jsonb NOT NULL,
	"current_assignee_id" uuid NOT NULL,
	"next_rotation_at" timestamp NOT NULL,
	"skip_weekends" boolean DEFAULT false NOT NULL,
	"fairness_score" real DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"max_bounty_points" integer DEFAULT 500 NOT NULL,
	"min_bounty_points" integer DEFAULT 5 NOT NULL,
	"default_expiration_hours" integer DEFAULT 48 NOT NULL,
	"require_parent_approval" boolean DEFAULT true NOT NULL,
	"allow_self_listing" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_configs_household_id_unique" UNIQUE("household_id")
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"chore_id" uuid NOT NULL,
	"chore_name" text NOT NULL,
	"listed_by_id" uuid NOT NULL,
	"listed_by_name" text NOT NULL,
	"claimed_by_id" uuid,
	"claimed_by_name" text,
	"point_bounty" integer NOT NULL,
	"bonus_condition" text,
	"bonus_points" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responsibility_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"default_classification" text DEFAULT 'responsibility' NOT NULL,
	"responsibility_label" text DEFAULT 'Responsibility' NOT NULL,
	"job_label" text DEFAULT 'Job' NOT NULL,
	"show_classification_badge" boolean DEFAULT true NOT NULL,
	"allow_member_toggle" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "responsibility_configs_household_id_unique" UNIQUE("household_id")
);
--> statement-breakpoint
CREATE TABLE "rotation_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rotation_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"member_name" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"was_skipped" boolean DEFAULT false NOT NULL,
	"skip_reason" text
);
--> statement-breakpoint
CREATE TABLE "chore_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chore_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" bigint DEFAULT 0,
	"mime_type" varchar(100),
	"is_photo_proof" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chore_board_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"view_mode" varchar(20) DEFAULT 'dashboard',
	"column_settings" jsonb DEFAULT '{}',
	"default_group_by" varchar(30),
	"default_sort" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chore_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"comment" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_chore_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"filters" jsonb DEFAULT '[]',
	"sort" jsonb DEFAULT '{}',
	"group_by" varchar(30),
	"visibility" varchar(20) DEFAULT 'private',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chore_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#6b7280' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stopped_at" timestamp with time zone,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chore_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chore_id" uuid NOT NULL,
	"depends_on_chore_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'blocks' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coppa_consents" ADD CONSTRAINT "coppa_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_links" ADD CONSTRAINT "member_links_primary_member_id_members_id_fk" FOREIGN KEY ("primary_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_links" ADD CONSTRAINT "member_links_primary_household_id_households_id_fk" FOREIGN KEY ("primary_household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_links" ADD CONSTRAINT "member_links_linked_member_id_members_id_fk" FOREIGN KEY ("linked_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_links" ADD CONSTRAINT "member_links_linked_household_id_households_id_fk" FOREIGN KEY ("linked_household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_households" ADD CONSTRAINT "user_households_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_households" ADD CONSTRAINT "user_households_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_template_id_chore_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."chore_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_approved_by_members_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_schedules" ADD CONSTRAINT "chore_schedules_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_schedules" ADD CONSTRAINT "chore_schedules_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_schedules" ADD CONSTRAINT "chore_schedules_assigned_to_members_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_schedules" ADD CONSTRAINT "chore_schedules_completion_id_chore_completions_id_fk" FOREIGN KEY ("completion_id") REFERENCES "public"."chore_completions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boss_battles" ADD CONSTRAINT "boss_battles_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_parties" ADD CONSTRAINT "family_parties_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_approved_by_members_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_fulfilled_by_members_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_rejected_by_members_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_thread_id_support_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."support_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_member_id_members_id_fk" FOREIGN KEY ("sender_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_created_by_member_id_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_member_id_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_settings" ADD CONSTRAINT "api_key_settings_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_usage_events" ADD CONSTRAINT "api_key_usage_events_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_usage_events" ADD CONSTRAINT "api_key_usage_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_app_requests" ADD CONSTRAINT "integration_app_requests_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_app_requests" ADD CONSTRAINT "integration_app_requests_app_id_integration_marketplace_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."integration_marketplace_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_app_requests" ADD CONSTRAINT "integration_app_requests_requested_by_member_id_members_id_fk" FOREIGN KEY ("requested_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_app_requests" ADD CONSTRAINT "integration_app_requests_reviewed_by_member_id_members_id_fk" FOREIGN KEY ("reviewed_by_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_oauth_client_id_oauth_clients_id_fk" FOREIGN KEY ("oauth_client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_access_tokens" ADD CONSTRAINT "oauth_access_tokens_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_oauth_client_id_oauth_clients_id_fk" FOREIGN KEY ("oauth_client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_clients" ADD CONSTRAINT "oauth_clients_created_by_member_id_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscription_id_webhook_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."webhook_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ADD CONSTRAINT "webhook_subscriptions_created_by_member_id_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_gift_cards" ADD CONSTRAINT "store_gift_cards_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_gift_cards" ADD CONSTRAINT "store_gift_cards_created_by_member_id_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_gift_cards" ADD CONSTRAINT "store_gift_cards_redeemed_by_member_id_members_id_fk" FOREIGN KEY ("redeemed_by_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_member_entitlements" ADD CONSTRAINT "store_member_entitlements_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_member_entitlements" ADD CONSTRAINT "store_member_entitlements_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_purchase_controls" ADD CONSTRAINT "store_purchase_controls_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_purchase_controls" ADD CONSTRAINT "store_purchase_controls_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_purchases" ADD CONSTRAINT "store_purchases_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_purchases" ADD CONSTRAINT "store_purchases_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_purchases" ADD CONSTRAINT "store_purchases_catalog_item_id_store_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."store_catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_purchases" ADD CONSTRAINT "store_purchases_approved_by_member_id_members_id_fk" FOREIGN KEY ("approved_by_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_refund_requests" ADD CONSTRAINT "store_refund_requests_purchase_id_store_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."store_purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_refund_requests" ADD CONSTRAINT "store_refund_requests_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_refund_requests" ADD CONSTRAINT "store_refund_requests_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_refund_requests" ADD CONSTRAINT "store_refund_requests_resolved_by_member_id_members_id_fk" FOREIGN KEY ("resolved_by_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_wallets" ADD CONSTRAINT "store_wallets_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_wallets" ADD CONSTRAINT "store_wallets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_admin_audits" ADD CONSTRAINT "enterprise_admin_audits_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_admin_audits" ADD CONSTRAINT "enterprise_admin_audits_school_id_enterprise_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."enterprise_schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_admin_audits" ADD CONSTRAINT "enterprise_admin_audits_actor_member_id_members_id_fk" FOREIGN KEY ("actor_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_assignment_submissions" ADD CONSTRAINT "enterprise_assignment_submissions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_assignment_submissions" ADD CONSTRAINT "enterprise_assignment_submissions_assignment_id_enterprise_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."enterprise_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_assignment_submissions" ADD CONSTRAINT "enterprise_assignment_submissions_student_member_id_members_id_fk" FOREIGN KEY ("student_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_assignment_submissions" ADD CONSTRAINT "enterprise_assignment_submissions_reviewer_member_id_members_id_fk" FOREIGN KEY ("reviewer_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_assignments" ADD CONSTRAINT "enterprise_assignments_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_assignments" ADD CONSTRAINT "enterprise_assignments_school_id_enterprise_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."enterprise_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_assignments" ADD CONSTRAINT "enterprise_assignments_classroom_id_enterprise_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."enterprise_classrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_assignments" ADD CONSTRAINT "enterprise_assignments_created_by_member_id_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_bulk_imports" ADD CONSTRAINT "enterprise_bulk_imports_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_bulk_imports" ADD CONSTRAINT "enterprise_bulk_imports_school_id_enterprise_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."enterprise_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_bulk_imports" ADD CONSTRAINT "enterprise_bulk_imports_classroom_id_enterprise_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."enterprise_classrooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_bulk_imports" ADD CONSTRAINT "enterprise_bulk_imports_imported_by_member_id_members_id_fk" FOREIGN KEY ("imported_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_challenge_participations" ADD CONSTRAINT "enterprise_challenge_participations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_challenge_participations" ADD CONSTRAINT "enterprise_challenge_participations_challenge_id_enterprise_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."enterprise_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_challenge_participations" ADD CONSTRAINT "enterprise_challenge_participations_classroom_id_enterprise_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."enterprise_classrooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_challenge_participations" ADD CONSTRAINT "enterprise_challenge_participations_student_member_id_members_id_fk" FOREIGN KEY ("student_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_challenges" ADD CONSTRAINT "enterprise_challenges_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_challenges" ADD CONSTRAINT "enterprise_challenges_school_id_enterprise_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."enterprise_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_challenges" ADD CONSTRAINT "enterprise_challenges_created_by_member_id_members_id_fk" FOREIGN KEY ("created_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_classroom_students" ADD CONSTRAINT "enterprise_classroom_students_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_classroom_students" ADD CONSTRAINT "enterprise_classroom_students_school_id_enterprise_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."enterprise_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_classroom_students" ADD CONSTRAINT "enterprise_classroom_students_classroom_id_enterprise_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."enterprise_classrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_classroom_students" ADD CONSTRAINT "enterprise_classroom_students_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_classrooms" ADD CONSTRAINT "enterprise_classrooms_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_classrooms" ADD CONSTRAINT "enterprise_classrooms_school_id_enterprise_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."enterprise_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_classrooms" ADD CONSTRAINT "enterprise_classrooms_teacher_member_id_members_id_fk" FOREIGN KEY ("teacher_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_districts" ADD CONSTRAINT "enterprise_districts_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_lms_integrations" ADD CONSTRAINT "enterprise_lms_integrations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_lms_integrations" ADD CONSTRAINT "enterprise_lms_integrations_school_id_enterprise_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."enterprise_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_parent_visibility" ADD CONSTRAINT "enterprise_parent_visibility_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_parent_visibility" ADD CONSTRAINT "enterprise_parent_visibility_school_id_enterprise_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."enterprise_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_parent_visibility" ADD CONSTRAINT "enterprise_parent_visibility_student_member_id_members_id_fk" FOREIGN KEY ("student_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_parent_visibility" ADD CONSTRAINT "enterprise_parent_visibility_updated_by_member_id_members_id_fk" FOREIGN KEY ("updated_by_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_schools" ADD CONSTRAINT "enterprise_schools_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_schools" ADD CONSTRAINT "enterprise_schools_district_id_enterprise_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."enterprise_districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_trades" ADD CONSTRAINT "chore_trades_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_trades" ADD CONSTRAINT "chore_trades_initiator_member_id_members_id_fk" FOREIGN KEY ("initiator_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_trades" ADD CONSTRAINT "chore_trades_recipient_member_id_members_id_fk" FOREIGN KEY ("recipient_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_trades" ADD CONSTRAINT "chore_trades_offered_chore_schedule_id_chore_schedules_id_fk" FOREIGN KEY ("offered_chore_schedule_id") REFERENCES "public"."chore_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_trades" ADD CONSTRAINT "chore_trades_requested_chore_schedule_id_chore_schedules_id_fk" FOREIGN KEY ("requested_chore_schedule_id") REFERENCES "public"."chore_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_trades" ADD CONSTRAINT "chore_trades_approved_by_members_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowance_payouts" ADD CONSTRAINT "allowance_payouts_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowance_payouts" ADD CONSTRAINT "allowance_payouts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowance_payouts" ADD CONSTRAINT "allowance_payouts_settings_id_allowance_settings_id_fk" FOREIGN KEY ("settings_id") REFERENCES "public"."allowance_settings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowance_payouts" ADD CONSTRAINT "allowance_payouts_paid_by_members_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowance_settings" ADD CONSTRAINT "allowance_settings_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allowance_settings" ADD CONSTRAINT "allowance_settings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_profiles" ADD CONSTRAINT "character_profiles_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_profiles" ADD CONSTRAINT "character_profiles_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_profiles" ADD CONSTRAINT "character_profiles_class_id_character_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."character_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_class_id_character_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."character_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skills" ADD CONSTRAINT "member_skills_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skills" ADD CONSTRAINT "member_skills_skill_id_character_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."character_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_abilities" ADD CONSTRAINT "pet_abilities_species_id_pet_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."pet_species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_events" ADD CONSTRAINT "pet_events_pet_id_virtual_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."virtual_pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_events" ADD CONSTRAINT "pet_events_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_playdates" ADD CONSTRAINT "pet_playdates_host_pet_id_virtual_pets_id_fk" FOREIGN KEY ("host_pet_id") REFERENCES "public"."virtual_pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_playdates" ADD CONSTRAINT "pet_playdates_guest_pet_id_virtual_pets_id_fk" FOREIGN KEY ("guest_pet_id") REFERENCES "public"."virtual_pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_pets" ADD CONSTRAINT "virtual_pets_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_pets" ADD CONSTRAINT "virtual_pets_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_pets" ADD CONSTRAINT "virtual_pets_species_id_pet_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."pet_species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_game_nights" ADD CONSTRAINT "family_game_nights_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_game_nights" ADD CONSTRAINT "family_game_nights_host_member_id_members_id_fk" FOREIGN KEY ("host_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_night_games" ADD CONSTRAINT "family_night_games_family_night_id_family_game_nights_id_fk" FOREIGN KEY ("family_night_id") REFERENCES "public"."family_game_nights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_night_games" ADD CONSTRAINT "family_night_games_game_id_mini_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."mini_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_night_games" ADD CONSTRAINT "family_night_games_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_night_games" ADD CONSTRAINT "family_night_games_winner_id_members_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_night_participants" ADD CONSTRAINT "family_night_participants_family_night_id_family_game_nights_id_fk" FOREIGN KEY ("family_night_id") REFERENCES "public"."family_game_nights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_night_participants" ADD CONSTRAINT "family_night_participants_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_configs" ADD CONSTRAINT "game_configs_game_id_mini_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."mini_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_game_id_mini_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."mini_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_game_id_mini_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."mini_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_unlocks" ADD CONSTRAINT "game_unlocks_game_id_mini_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."mini_games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_unlocks" ADD CONSTRAINT "game_unlocks_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_unlocks" ADD CONSTRAINT "game_unlocks_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_players" ADD CONSTRAINT "session_players_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_rewards" ADD CONSTRAINT "card_rewards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_rewards" ADD CONSTRAINT "card_rewards_pack_id_card_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."card_packs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_showcases" ADD CONSTRAINT "card_showcases_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_trades" ADD CONSTRAINT "card_trades_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_trades" ADD CONSTRAINT "card_trades_initiator_member_id_members_id_fk" FOREIGN KEY ("initiator_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_trades" ADD CONSTRAINT "card_trades_target_member_id_members_id_fk" FOREIGN KEY ("target_member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_wishlists" ADD CONSTRAINT "card_wishlists_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_wishlists" ADD CONSTRAINT "card_wishlists_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_stats" ADD CONSTRAINT "collection_stats_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_cards" ADD CONSTRAINT "owned_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_cards" ADD CONSTRAINT "owned_cards_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owned_cards" ADD CONSTRAINT "owned_cards_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_openings" ADD CONSTRAINT "pack_openings_pack_id_card_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."card_packs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_openings" ADD CONSTRAINT "pack_openings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_openings" ADD CONSTRAINT "pack_openings_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_completions" ADD CONSTRAINT "set_completions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_completions" ADD CONSTRAINT "set_completions_set_id_card_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."card_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_characters" ADD CONSTRAINT "chapter_characters_chapter_id_story_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."story_chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_characters" ADD CONSTRAINT "chapter_characters_character_id_story_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."story_characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_chapter_progress" ADD CONSTRAINT "member_chapter_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_chapter_progress" ADD CONSTRAINT "member_chapter_progress_chapter_id_story_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."story_chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_quest_progress" ADD CONSTRAINT "member_quest_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_quest_progress" ADD CONSTRAINT "member_quest_progress_quest_id_story_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."story_quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_story_progress" ADD CONSTRAINT "member_story_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_story_progress" ADD CONSTRAINT "member_story_progress_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_story_progress" ADD CONSTRAINT "member_story_progress_current_chapter_id_story_chapters_id_fk" FOREIGN KEY ("current_chapter_id") REFERENCES "public"."story_chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_story_progress" ADD CONSTRAINT "member_story_progress_current_quest_id_story_quests_id_fk" FOREIGN KEY ("current_quest_id") REFERENCES "public"."story_quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_unlocked_characters" ADD CONSTRAINT "member_unlocked_characters_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_unlocked_characters" ADD CONSTRAINT "member_unlocked_characters_character_id_story_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."story_characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_dialogues" ADD CONSTRAINT "story_dialogues_quest_id_story_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."story_quests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_quests" ADD CONSTRAINT "story_quests_chapter_id_story_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."story_chapters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_automation_id_smart_home_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."smart_home_automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_zone_devices" ADD CONSTRAINT "chore_zone_devices_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_activity_logs" ADD CONSTRAINT "device_activity_logs_device_id_smart_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."smart_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_activity_logs" ADD CONSTRAINT "device_activity_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_devices" ADD CONSTRAINT "smart_devices_hub_id_smart_home_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."smart_home_hubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_devices" ADD CONSTRAINT "smart_devices_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_home_automations" ADD CONSTRAINT "smart_home_automations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_home_hubs" ADD CONSTRAINT "smart_home_hubs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleanliness_metrics" ADD CONSTRAINT "cleanliness_metrics_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_events" ADD CONSTRAINT "detection_events_rule_id_detection_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."detection_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_events" ADD CONSTRAINT "detection_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_events" ADD CONSTRAINT "detection_events_device_id_smart_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."smart_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_events" ADD CONSTRAINT "detection_events_confirmed_by_members_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_patterns" ADD CONSTRAINT "detection_patterns_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_patterns" ADD CONSTRAINT "detection_patterns_typical_member_id_members_id_fk" FOREIGN KEY ("typical_member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_rules" ADD CONSTRAINT "detection_rules_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detection_rules" ADD CONSTRAINT "detection_rules_device_id_smart_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."smart_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_device_id_smart_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."smart_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoint_progress" ADD CONSTRAINT "checkpoint_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoint_progress" ADD CONSTRAINT "checkpoint_progress_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkpoint_progress" ADD CONSTRAINT "checkpoint_progress_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_checkouts" ADD CONSTRAINT "equipment_checkouts_qr_code_id_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_checkouts" ADD CONSTRAINT "equipment_checkouts_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_checkouts" ADD CONSTRAINT "equipment_checkouts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_code_scans" ADD CONSTRAINT "qr_code_scans_qr_code_id_qr_codes_id_fk" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_code_scans" ADD CONSTRAINT "qr_code_scans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_code_scans" ADD CONSTRAINT "qr_code_scans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_linked_chore_id_chores_id_fk" FOREIGN KEY ("linked_chore_id") REFERENCES "public"."chores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_last_scanned_by_members_id_fk" FOREIGN KEY ("last_scanned_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "away_mode_configs" ADD CONSTRAINT "away_mode_configs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "away_mode_configs" ADD CONSTRAINT "away_mode_configs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "away_mode_configs" ADD CONSTRAINT "away_mode_configs_expected_return_geofence_id_geofences_id_fk" FOREIGN KEY ("expected_return_geofence_id") REFERENCES "public"."geofences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_automations" ADD CONSTRAINT "geofence_automations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_automations" ADD CONSTRAINT "geofence_automations_geofence_id_geofences_id_fk" FOREIGN KEY ("geofence_id") REFERENCES "public"."geofences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_geofence_id_geofences_id_fk" FOREIGN KEY ("geofence_id") REFERENCES "public"."geofences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_geofence_id_geofences_id_fk" FOREIGN KEY ("geofence_id") REFERENCES "public"."geofences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_settings" ADD CONSTRAINT "location_settings_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_settings" ADD CONSTRAINT "location_settings_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_locations" ADD CONSTRAINT "member_locations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_locations" ADD CONSTRAINT "member_locations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_locations" ADD CONSTRAINT "member_locations_current_geofence_id_geofences_id_fk" FOREIGN KEY ("current_geofence_id") REFERENCES "public"."geofences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_screen_time_rewards" ADD CONSTRAINT "chore_screen_time_rewards_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_screen_time_rewards" ADD CONSTRAINT "chore_screen_time_rewards_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_access_schedules" ADD CONSTRAINT "device_access_schedules_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_access_schedules" ADD CONSTRAINT "device_access_schedules_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_access_schedules" ADD CONSTRAINT "device_access_schedules_device_id_tracked_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."tracked_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_extension_requests" ADD CONSTRAINT "screen_time_extension_requests_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_extension_requests" ADD CONSTRAINT "screen_time_extension_requests_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_extension_requests" ADD CONSTRAINT "screen_time_extension_requests_responded_by_members_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_limits" ADD CONSTRAINT "screen_time_limits_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_limits" ADD CONSTRAINT "screen_time_limits_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_rewards" ADD CONSTRAINT "screen_time_rewards_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_rewards" ADD CONSTRAINT "screen_time_rewards_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_usage" ADD CONSTRAINT "screen_time_usage_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screen_time_usage" ADD CONSTRAINT "screen_time_usage_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_devices" ADD CONSTRAINT "tracked_devices_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_devices" ADD CONSTRAINT "tracked_devices_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_reminders" ADD CONSTRAINT "study_reminders_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_reminders" ADD CONSTRAINT "study_reminders_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_reminders" ADD CONSTRAINT "study_reminders_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_reminders" ADD CONSTRAINT "study_reminders_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_streaks" ADD CONSTRAINT "study_streaks_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_streaks" ADD CONSTRAINT "study_streaks_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_educational_links" ADD CONSTRAINT "chore_educational_links_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_educational_links" ADD CONSTRAINT "chore_educational_links_template_id_educational_chore_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."educational_chore_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_educational_links" ADD CONSTRAINT "chore_educational_links_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_educational_links" ADD CONSTRAINT "chore_educational_links_completed_session_id_educational_sessions_id_fk" FOREIGN KEY ("completed_session_id") REFERENCES "public"."educational_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_achievements" ADD CONSTRAINT "educational_achievements_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_achievements" ADD CONSTRAINT "educational_achievements_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_answers" ADD CONSTRAINT "educational_answers_session_id_educational_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."educational_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_answers" ADD CONSTRAINT "educational_answers_question_id_educational_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."educational_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_chore_templates" ADD CONSTRAINT "educational_chore_templates_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_questions" ADD CONSTRAINT "educational_questions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_sessions" ADD CONSTRAINT "educational_sessions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_sessions" ADD CONSTRAINT "educational_sessions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_sessions" ADD CONSTRAINT "educational_sessions_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_sessions" ADD CONSTRAINT "educational_sessions_template_id_educational_chore_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."educational_chore_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_educational_progress" ADD CONSTRAINT "member_educational_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_educational_progress" ADD CONSTRAINT "member_educational_progress_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_learning_path_progress" ADD CONSTRAINT "member_learning_path_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_learning_path_progress" ADD CONSTRAINT "member_learning_path_progress_path_id_learning_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."learning_paths"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_learning_path_progress" ADD CONSTRAINT "member_learning_path_progress_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_achievements" ADD CONSTRAINT "academic_achievements_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_achievements" ADD CONSTRAINT "academic_achievements_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_achievements" ADD CONSTRAINT "academic_achievements_report_card_id_report_cards_id_fk" FOREIGN KEY ("report_card_id") REFERENCES "public"."report_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_goals" ADD CONSTRAINT "academic_goals_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_goals" ADD CONSTRAINT "academic_goals_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_goals" ADD CONSTRAINT "academic_goals_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_trends" ADD CONSTRAINT "academic_trends_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_trends" ADD CONSTRAINT "academic_trends_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_trends" ADD CONSTRAINT "academic_trends_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_bonus_configs" ADD CONSTRAINT "grade_bonus_configs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_scales" ADD CONSTRAINT "grading_scales_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "honor_roll_configs" ADD CONSTRAINT "honor_roll_configs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_card_grades" ADD CONSTRAINT "report_card_grades_report_card_id_report_cards_id_fk" FOREIGN KEY ("report_card_id") REFERENCES "public"."report_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_card_grades" ADD CONSTRAINT "report_card_grades_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_tips" ADD CONSTRAINT "expert_tips_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expert_tips" ADD CONSTRAINT "expert_tips_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_challenge_progress" ADD CONSTRAINT "member_challenge_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_challenge_progress" ADD CONSTRAINT "member_challenge_progress_challenge_id_skill_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."skill_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_challenge_progress" ADD CONSTRAINT "member_challenge_progress_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skill_badges" ADD CONSTRAINT "member_skill_badges_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skill_badges" ADD CONSTRAINT "member_skill_badges_badge_id_skill_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."skill_badges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skill_badges" ADD CONSTRAINT "member_skill_badges_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skill_progress" ADD CONSTRAINT "member_skill_progress_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skill_progress" ADD CONSTRAINT "member_skill_progress_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skill_progress" ADD CONSTRAINT "member_skill_progress_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_skill_progress" ADD CONSTRAINT "member_skill_progress_mentor_id_members_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_relations" ADD CONSTRAINT "mentorship_relations_mentor_id_members_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_relations" ADD CONSTRAINT "mentorship_relations_mentee_id_members_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_relations" ADD CONSTRAINT "mentorship_relations_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_relations" ADD CONSTRAINT "mentorship_relations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_badges" ADD CONSTRAINT "skill_badges_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_badges" ADD CONSTRAINT "skill_badges_skill_tree_id_skill_trees_id_fk" FOREIGN KEY ("skill_tree_id") REFERENCES "public"."skill_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_badges" ADD CONSTRAINT "skill_badges_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_certifications" ADD CONSTRAINT "skill_certifications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_certifications" ADD CONSTRAINT "skill_certifications_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_certifications" ADD CONSTRAINT "skill_certifications_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_certifications" ADD CONSTRAINT "skill_certifications_certified_by_id_members_id_fk" FOREIGN KEY ("certified_by_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_challenges" ADD CONSTRAINT "skill_challenges_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_challenges" ADD CONSTRAINT "skill_challenges_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_practice_logs" ADD CONSTRAINT "skill_practice_logs_member_skill_progress_id_member_skill_progress_id_fk" FOREIGN KEY ("member_skill_progress_id") REFERENCES "public"."member_skill_progress"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_practice_logs" ADD CONSTRAINT "skill_practice_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_practice_logs" ADD CONSTRAINT "skill_practice_logs_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_practice_logs" ADD CONSTRAINT "skill_practice_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_practice_logs" ADD CONSTRAINT "skill_practice_logs_mentor_id_members_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_trees" ADD CONSTRAINT "skill_trees_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_skill_tree_id_skill_trees_id_fk" FOREIGN KEY ("skill_tree_id") REFERENCES "public"."skill_trees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_activity_id_extracurricular_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."extracurricular_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_schedules" ADD CONSTRAINT "activity_schedules_activity_id_extracurricular_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."extracurricular_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_schedules" ADD CONSTRAINT "activity_schedules_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_schedules" ADD CONSTRAINT "activity_schedules_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_recommendations" ADD CONSTRAINT "balance_recommendations_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balance_recommendations" ADD CONSTRAINT "balance_recommendations_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_periods" ADD CONSTRAINT "class_periods_schedule_id_school_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."school_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_periods" ADD CONSTRAINT "class_periods_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_periods" ADD CONSTRAINT "class_periods_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_prep_activities" ADD CONSTRAINT "college_prep_activities_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_prep_activities" ADD CONSTRAINT "college_prep_activities_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracurricular_activities" ADD CONSTRAINT "extracurricular_activities_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracurricular_activities" ADD CONSTRAINT "extracurricular_activities_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_activity_id_extracurricular_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."extracurricular_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_conflicts" ADD CONSTRAINT "schedule_conflicts_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_conflicts" ADD CONSTRAINT "schedule_conflicts_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_schedules" ADD CONSTRAINT "school_schedules_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_schedules" ADD CONSTRAINT "school_schedules_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_rosters" ADD CONSTRAINT "team_rosters_activity_id_extracurricular_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."extracurricular_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_rosters" ADD CONSTRAINT "team_rosters_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_logs" ADD CONSTRAINT "volunteer_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_logs" ADD CONSTRAINT "volunteer_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_logs" ADD CONSTRAINT "volunteer_logs_verified_by_members_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_goals" ADD CONSTRAINT "activity_goals_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_created_by_id_members_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellness_check_ins" ADD CONSTRAINT "wellness_check_ins_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advanced_reports" ADD CONSTRAINT "advanced_reports_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advanced_reports" ADD CONSTRAINT "advanced_reports_created_by_id_members_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_members_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_requested_by_id_members_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_report_id_advanced_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."advanced_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_event_participations" ADD CONSTRAINT "community_event_participations_event_id_community_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."community_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_author_id_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_challenge_participants" ADD CONSTRAINT "social_challenge_participants_challenge_id_social_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."social_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_challenges" ADD CONSTRAINT "social_challenges_created_by_id_members_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_author_id_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_author_id_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_activity_log" ADD CONSTRAINT "chore_activity_log_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_activity_log" ADD CONSTRAINT "chore_activity_log_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_attachments" ADD CONSTRAINT "chore_attachments_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_attachments" ADD CONSTRAINT "chore_attachments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_board_preferences" ADD CONSTRAINT "chore_board_preferences_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_board_preferences" ADD CONSTRAINT "chore_board_preferences_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_comments" ADD CONSTRAINT "chore_comments_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_comments" ADD CONSTRAINT "chore_comments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_chore_filters" ADD CONSTRAINT "saved_chore_filters_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_chore_filters" ADD CONSTRAINT "saved_chore_filters_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_tags" ADD CONSTRAINT "chore_tags_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_tags" ADD CONSTRAINT "chore_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_logs" ADD CONSTRAINT "time_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_dependencies" ADD CONSTRAINT "chore_dependencies_chore_id_chores_id_fk" FOREIGN KEY ("chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chore_dependencies" ADD CONSTRAINT "chore_dependencies_depends_on_chore_id_chores_id_fk" FOREIGN KEY ("depends_on_chore_id") REFERENCES "public"."chores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_households_created_by" ON "households" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_invite_codes_code" ON "invite_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_invite_codes_household" ON "invite_codes" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_member_links_primary" ON "member_links" USING btree ("primary_member_id");--> statement-breakpoint
CREATE INDEX "idx_member_links_linked" ON "member_links" USING btree ("linked_member_id");--> statement-breakpoint
CREATE INDEX "idx_members_household" ON "members" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_members_user" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_members_linked" ON "members" USING btree ("linked_member_id");--> statement-breakpoint
CREATE INDEX "idx_templates_category" ON "chore_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_templates_age" ON "chore_templates" USING btree ("min_age","max_age");--> statement-breakpoint
CREATE INDEX "idx_chores_household" ON "chores" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_chores_active" ON "chores" USING btree ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_completions_chore" ON "chore_completions" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "idx_completions_member" ON "chore_completions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_completions_date" ON "chore_completions" USING btree ("household_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_completions_status" ON "chore_completions" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "idx_schedules_date" ON "chore_schedules" USING btree ("household_id","scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_schedules_member" ON "chore_schedules" USING btree ("assigned_to","scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_boss_battles_household" ON "boss_battles" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_boss_battles_active" ON "boss_battles" USING btree ("household_id","defeated_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_member" ON "point_transactions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_household" ON "point_transactions" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_redemptions_reward" ON "reward_redemptions" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX "idx_redemptions_member" ON "reward_redemptions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_redemptions_status" ON "reward_redemptions" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "idx_rewards_household" ON "rewards" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_rewards_active" ON "rewards" USING btree ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_support_messages_thread" ON "support_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "idx_support_messages_household" ON "support_messages" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_support_threads_household" ON "support_threads" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_support_threads_status" ON "support_threads" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "idx_api_keys_household" ON "api_keys" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_prefix" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "idx_api_key_settings_last_request" ON "api_key_settings" USING btree ("last_request_at");--> statement-breakpoint
CREATE INDEX "idx_api_key_usage_key_time" ON "api_key_usage_events" USING btree ("api_key_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_api_key_usage_household_time" ON "api_key_usage_events" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_api_key_usage_path" ON "api_key_usage_events" USING btree ("request_path");--> statement-breakpoint
CREATE INDEX "idx_api_sdk_packages_language" ON "api_sdk_packages" USING btree ("language");--> statement-breakpoint
CREATE INDEX "idx_integration_requests_household" ON "integration_app_requests" USING btree ("household_id","requested_at");--> statement-breakpoint
CREATE INDEX "idx_integration_requests_status" ON "integration_app_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_marketplace_apps_status" ON "integration_marketplace_apps" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_marketplace_apps_category" ON "integration_marketplace_apps" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_oauth_tokens_client" ON "oauth_access_tokens" USING btree ("oauth_client_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_oauth_tokens_household" ON "oauth_access_tokens" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_oauth_codes_client" ON "oauth_authorization_codes" USING btree ("oauth_client_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_oauth_clients_household" ON "oauth_clients" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_subscription" ON "webhook_deliveries" USING btree ("subscription_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_household" ON "webhook_deliveries" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_deliveries_status" ON "webhook_deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_webhook_subscriptions_household" ON "webhook_subscriptions" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_subscriptions_status" ON "webhook_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_store_catalog_active" ON "store_catalog_items" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_store_catalog_type" ON "store_catalog_items" USING btree ("item_type");--> statement-breakpoint
CREATE INDEX "idx_store_catalog_category" ON "store_catalog_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_store_catalog_limited" ON "store_catalog_items" USING btree ("is_limited_time","available_from","available_until");--> statement-breakpoint
CREATE INDEX "idx_store_gift_cards_household" ON "store_gift_cards" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_store_gift_cards_status" ON "store_gift_cards" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_store_gift_cards_code" ON "store_gift_cards" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_store_entitlements_member" ON "store_member_entitlements" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_store_entitlements_household" ON "store_member_entitlements" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_store_controls_household" ON "store_purchase_controls" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_store_controls_member" ON "store_purchase_controls" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_store_purchases_household" ON "store_purchases" USING btree ("household_id","purchased_at");--> statement-breakpoint
CREATE INDEX "idx_store_purchases_member" ON "store_purchases" USING btree ("member_id","purchased_at");--> statement-breakpoint
CREATE INDEX "idx_store_purchases_status" ON "store_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_store_purchases_item" ON "store_purchases" USING btree ("catalog_item_id");--> statement-breakpoint
CREATE INDEX "idx_store_refunds_household" ON "store_refund_requests" USING btree ("household_id","requested_at");--> statement-breakpoint
CREATE INDEX "idx_store_refunds_purchase" ON "store_refund_requests" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_store_refunds_status" ON "store_refund_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_store_wallets_household" ON "store_wallets" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_store_wallets_member" ON "store_wallets" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_admin_audits_school" ON "enterprise_admin_audits" USING btree ("school_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_enterprise_admin_audits_household" ON "enterprise_admin_audits" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_enterprise_submissions_assignment" ON "enterprise_assignment_submissions" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_submissions_student" ON "enterprise_assignment_submissions" USING btree ("student_member_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_assignments_classroom" ON "enterprise_assignments" USING btree ("classroom_id","status");--> statement-breakpoint
CREATE INDEX "idx_enterprise_assignments_due" ON "enterprise_assignments" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "idx_enterprise_bulk_imports_school" ON "enterprise_bulk_imports" USING btree ("school_id","imported_at");--> statement-breakpoint
CREATE INDEX "idx_enterprise_challenge_participations_challenge" ON "enterprise_challenge_participations" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_challenges_school" ON "enterprise_challenges" USING btree ("school_id","status");--> statement-breakpoint
CREATE INDEX "idx_enterprise_classroom_students_classroom" ON "enterprise_classroom_students" USING btree ("classroom_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_classroom_students_member" ON "enterprise_classroom_students" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_classrooms_household" ON "enterprise_classrooms" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_classrooms_school" ON "enterprise_classrooms" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_districts_household" ON "enterprise_districts" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_lms_school" ON "enterprise_lms_integrations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_schools_household" ON "enterprise_schools" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_schools_district" ON "enterprise_schools" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "idx_device_tokens_user" ON "device_tokens" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_notification_log_user" ON "notification_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_notification_log_type" ON "notification_log" USING btree ("notification_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_trades_household" ON "chore_trades" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_trades_initiator" ON "chore_trades" USING btree ("initiator_member_id");--> statement-breakpoint
CREATE INDEX "idx_trades_recipient" ON "chore_trades" USING btree ("recipient_member_id");--> statement-breakpoint
CREATE INDEX "idx_trades_status" ON "chore_trades" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "idx_trades_expires" ON "chore_trades" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_allowance_payouts_household" ON "allowance_payouts" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_allowance_payouts_member" ON "allowance_payouts" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_allowance_payouts_status" ON "allowance_payouts" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "idx_allowance_payouts_period" ON "allowance_payouts" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_allowance_settings_household" ON "allowance_settings" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_allowance_settings_member" ON "allowance_settings" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_avatar_items_category" ON "avatar_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_avatar_items_unlock" ON "avatar_items" USING btree ("unlock_type");--> statement-breakpoint
CREATE INDEX "idx_character_profiles_member" ON "character_profiles" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_character_profiles_household" ON "character_profiles" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_character_profiles_class" ON "character_profiles" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_character_profiles_level" ON "character_profiles" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_member_skills_member" ON "member_skills" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_skills_skill" ON "member_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "idx_xp_transactions_member" ON "xp_transactions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_xp_transactions_household" ON "xp_transactions" USING btree ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pet_accessories_category" ON "pet_accessories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_pet_events_pet" ON "pet_events" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "idx_pet_events_member" ON "pet_events" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_pet_events_type" ON "pet_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_pet_playdates_host" ON "pet_playdates" USING btree ("host_pet_id");--> statement-breakpoint
CREATE INDEX "idx_pet_playdates_guest" ON "pet_playdates" USING btree ("guest_pet_id");--> statement-breakpoint
CREATE INDEX "idx_pet_playdates_status" ON "pet_playdates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_virtual_pets_member" ON "virtual_pets" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_virtual_pets_household" ON "virtual_pets" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_virtual_pets_species" ON "virtual_pets" USING btree ("species_id");--> statement-breakpoint
CREATE INDEX "idx_family_game_nights_household" ON "family_game_nights" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_family_game_nights_status" ON "family_game_nights" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_family_game_nights_scheduled" ON "family_game_nights" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_family_night_games_night" ON "family_night_games" USING btree ("family_night_id");--> statement-breakpoint
CREATE INDEX "idx_family_night_participants_night" ON "family_night_participants" USING btree ("family_night_id");--> statement-breakpoint
CREATE INDEX "idx_family_night_participants_member" ON "family_night_participants" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_game_configs_game" ON "game_configs" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_scores_member" ON "game_scores" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_game_scores_household" ON "game_scores" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_game_scores_game" ON "game_scores" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_scores_score" ON "game_scores" USING btree ("score");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_household" ON "game_sessions" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_game" ON "game_sessions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_sessions_status" ON "game_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_game_unlocks_member" ON "game_unlocks" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_game_unlocks_household" ON "game_unlocks" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_game_unlocks_game" ON "game_unlocks" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_session_players_session" ON "session_players" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_session_players_member" ON "session_players" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_card_packs_type" ON "card_packs" USING btree ("pack_type");--> statement-breakpoint
CREATE INDEX "idx_card_packs_active" ON "card_packs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_card_showcases_member" ON "card_showcases" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_card_trades_household" ON "card_trades" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_card_trades_initiator" ON "card_trades" USING btree ("initiator_member_id");--> statement-breakpoint
CREATE INDEX "idx_card_trades_target" ON "card_trades" USING btree ("target_member_id");--> statement-breakpoint
CREATE INDEX "idx_card_trades_status" ON "card_trades" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_card_wishlists_member" ON "card_wishlists" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_cards_set" ON "cards" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "idx_cards_category" ON "cards" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_cards_rarity" ON "cards" USING btree ("rarity");--> statement-breakpoint
CREATE INDEX "idx_collection_stats_member" ON "collection_stats" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_owned_cards_member" ON "owned_cards" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_owned_cards_household" ON "owned_cards" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_owned_cards_card" ON "owned_cards" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "idx_pack_openings_member" ON "pack_openings" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_pack_openings_pack" ON "pack_openings" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "idx_pack_openings_date" ON "pack_openings" USING btree ("opened_at");--> statement-breakpoint
CREATE INDEX "idx_set_completions_member" ON "set_completions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_chapter_progress_member" ON "member_chapter_progress" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_chapter_progress_chapter" ON "member_chapter_progress" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "idx_member_quest_progress_member" ON "member_quest_progress" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_quest_progress_quest" ON "member_quest_progress" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "idx_member_story_progress_member" ON "member_story_progress" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_story_progress_household" ON "member_story_progress" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_member_unlocked_characters_member" ON "member_unlocked_characters" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_story_chapters_number" ON "story_chapters" USING btree ("number");--> statement-breakpoint
CREATE INDEX "idx_story_chapters_prerequisite" ON "story_chapters" USING btree ("prerequisite_chapter_id");--> statement-breakpoint
CREATE INDEX "idx_story_dialogues_quest" ON "story_dialogues" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "idx_story_dialogues_trigger" ON "story_dialogues" USING btree ("trigger_type","trigger_id");--> statement-breakpoint
CREATE INDEX "idx_story_quests_chapter" ON "story_quests" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "idx_automation_logs_automation" ON "automation_logs" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "idx_automation_logs_household" ON "automation_logs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_automation_logs_triggered" ON "automation_logs" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "idx_automation_logs_status" ON "automation_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_chore_zone_devices_household" ON "chore_zone_devices" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_chore_zone_devices_zone" ON "chore_zone_devices" USING btree ("zone_name");--> statement-breakpoint
CREATE INDEX "idx_device_activity_device" ON "device_activity_logs" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_device_activity_household" ON "device_activity_logs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_device_activity_detected" ON "device_activity_logs" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "idx_device_activity_type" ON "device_activity_logs" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_device_activity_chore" ON "device_activity_logs" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "idx_smart_devices_hub" ON "smart_devices" USING btree ("hub_id");--> statement-breakpoint
CREATE INDEX "idx_smart_devices_household" ON "smart_devices" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_smart_devices_category" ON "smart_devices" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_smart_devices_location" ON "smart_devices" USING btree ("location");--> statement-breakpoint
CREATE INDEX "idx_smart_devices_zone" ON "smart_devices" USING btree ("chore_related_zone");--> statement-breakpoint
CREATE INDEX "idx_smart_home_automations_household" ON "smart_home_automations" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_smart_home_automations_enabled" ON "smart_home_automations" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_smart_home_hubs_household" ON "smart_home_hubs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_smart_home_hubs_platform" ON "smart_home_hubs" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_smart_home_hubs_status" ON "smart_home_hubs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_codes_code_data_idx" ON "qr_codes" USING btree ("code_data");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_codes_household_idx" ON "qr_codes" USING btree ("household_id","status");--> statement-breakpoint
CREATE INDEX "geofence_events_member_idx" ON "geofence_events" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "geofence_events_geofence_idx" ON "geofence_events" USING btree ("geofence_id");--> statement-breakpoint
CREATE INDEX "geofence_events_time_idx" ON "geofence_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "geofences_household_idx" ON "geofences" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "location_history_member_time_idx" ON "location_history" USING btree ("member_id","recorded_at");--> statement-breakpoint
CREATE INDEX "screen_time_rewards_member_idx" ON "screen_time_rewards" USING btree ("member_id","is_used");--> statement-breakpoint
CREATE INDEX "screen_time_usage_member_date_idx" ON "screen_time_usage" USING btree ("member_id","date");--> statement-breakpoint
CREATE INDEX "tracked_devices_member_idx" ON "tracked_devices" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "assignments_member_due_idx" ON "assignments" USING btree ("member_id","due_date");--> statement-breakpoint
CREATE INDEX "assignments_status_idx" ON "assignments" USING btree ("member_id","status");--> statement-breakpoint
CREATE INDEX "study_goals_member_active_idx" ON "study_goals" USING btree ("member_id","is_active");--> statement-breakpoint
CREATE INDEX "study_plans_member_date_idx" ON "study_plans" USING btree ("member_id","date");--> statement-breakpoint
CREATE INDEX "study_reminders_member_enabled_idx" ON "study_reminders" USING btree ("member_id","is_enabled");--> statement-breakpoint
CREATE INDEX "study_sessions_member_date_idx" ON "study_sessions" USING btree ("member_id","started_at");--> statement-breakpoint
CREATE INDEX "subjects_member_idx" ON "subjects" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "chore_edu_links_chore_idx" ON "chore_educational_links" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "edu_achievements_member_idx" ON "educational_achievements" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "edu_answers_session_idx" ON "educational_answers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "edu_questions_content_type_idx" ON "educational_questions" USING btree ("content_type","difficulty");--> statement-breakpoint
CREATE INDEX "edu_sessions_member_idx" ON "educational_sessions" USING btree ("member_id","created_at");--> statement-breakpoint
CREATE INDEX "member_path_progress_idx" ON "member_learning_path_progress" USING btree ("member_id","path_id");--> statement-breakpoint
CREATE INDEX "academic_achievements_member_year_idx" ON "academic_achievements" USING btree ("member_id","school_year");--> statement-breakpoint
CREATE INDEX "academic_achievements_type_idx" ON "academic_achievements" USING btree ("member_id","achievement_type");--> statement-breakpoint
CREATE INDEX "academic_goals_member_year_idx" ON "academic_goals" USING btree ("member_id","school_year");--> statement-breakpoint
CREATE INDEX "academic_trends_member_metric_idx" ON "academic_trends" USING btree ("member_id","metric_type");--> statement-breakpoint
CREATE INDEX "academic_trends_year_period_idx" ON "academic_trends" USING btree ("member_id","school_year","period_number");--> statement-breakpoint
CREATE INDEX "attendance_records_member_year_idx" ON "attendance_records" USING btree ("member_id","school_year");--> statement-breakpoint
CREATE INDEX "attendance_records_period_idx" ON "attendance_records" USING btree ("member_id","period_type","period_number");--> statement-breakpoint
CREATE INDEX "grade_bonus_configs_household_active_idx" ON "grade_bonus_configs" USING btree ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "grading_scales_household_idx" ON "grading_scales" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "honor_roll_configs_household_active_idx" ON "honor_roll_configs" USING btree ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "report_card_grades_card_idx" ON "report_card_grades" USING btree ("report_card_id");--> statement-breakpoint
CREATE INDEX "report_cards_member_year_idx" ON "report_cards" USING btree ("member_id","school_year");--> statement-breakpoint
CREATE INDEX "report_cards_period_idx" ON "report_cards" USING btree ("member_id","period_type","period_number");--> statement-breakpoint
CREATE INDEX "expert_tips_skill_idx" ON "expert_tips" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "member_challenge_progress_member_challenge_idx" ON "member_challenge_progress" USING btree ("member_id","challenge_id");--> statement-breakpoint
CREATE INDEX "member_skill_badges_member_idx" ON "member_skill_badges" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_skill_progress_member_skill_idx" ON "member_skill_progress" USING btree ("member_id","skill_id");--> statement-breakpoint
CREATE INDEX "member_skill_progress_status_idx" ON "member_skill_progress" USING btree ("member_id","status");--> statement-breakpoint
CREATE INDEX "mentorship_relations_mentor_idx" ON "mentorship_relations" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "mentorship_relations_mentee_idx" ON "mentorship_relations" USING btree ("mentee_id");--> statement-breakpoint
CREATE INDEX "mentorship_relations_skill_idx" ON "mentorship_relations" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_badges_household_idx" ON "skill_badges" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "skill_certifications_member_skill_idx" ON "skill_certifications" USING btree ("member_id","skill_id");--> statement-breakpoint
CREATE INDEX "skill_certifications_status_idx" ON "skill_certifications" USING btree ("member_id","status");--> statement-breakpoint
CREATE INDEX "skill_challenges_skill_idx" ON "skill_challenges" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "skill_practice_logs_member_date_idx" ON "skill_practice_logs" USING btree ("member_id","practiced_at");--> statement-breakpoint
CREATE INDEX "skill_trees_household_idx" ON "skill_trees" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "skill_trees_category_idx" ON "skill_trees" USING btree ("household_id","category");--> statement-breakpoint
CREATE INDEX "skills_tree_idx" ON "skills" USING btree ("skill_tree_id");--> statement-breakpoint
CREATE INDEX "skills_level_idx" ON "skills" USING btree ("skill_tree_id","level");--> statement-breakpoint
CREATE INDEX "activity_events_activity_date_idx" ON "activity_events" USING btree ("activity_id","event_date");--> statement-breakpoint
CREATE INDEX "activity_events_member_date_idx" ON "activity_events" USING btree ("member_id","event_date");--> statement-breakpoint
CREATE INDEX "activity_schedules_activity_idx" ON "activity_schedules" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "balance_recommendations_member_idx" ON "balance_recommendations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "class_periods_schedule_idx" ON "class_periods" USING btree ("schedule_id");--> statement-breakpoint
CREATE INDEX "class_periods_member_day_idx" ON "class_periods" USING btree ("member_id","day_of_week");--> statement-breakpoint
CREATE INDEX "college_prep_activities_member_status_idx" ON "college_prep_activities" USING btree ("member_id","status");--> statement-breakpoint
CREATE INDEX "extracurricular_activities_member_idx" ON "extracurricular_activities" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "extracurricular_activities_category_idx" ON "extracurricular_activities" USING btree ("member_id","category");--> statement-breakpoint
CREATE INDEX "practice_logs_member_date_idx" ON "practice_logs" USING btree ("member_id","practice_date");--> statement-breakpoint
CREATE INDEX "schedule_conflicts_member_date_idx" ON "schedule_conflicts" USING btree ("member_id","conflict_date");--> statement-breakpoint
CREATE INDEX "school_schedules_member_idx" ON "school_schedules" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "team_rosters_activity_idx" ON "team_rosters" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "volunteer_logs_member_date_idx" ON "volunteer_logs" USING btree ("member_id","volunteer_date");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_provider" ON "webhook_events" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_processed_at" ON "webhook_events" USING btree ("processed_at");--> statement-breakpoint
CREATE INDEX "idx_activity_goals_household" ON "activity_goals" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_activity_goals_member" ON "activity_goals" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_household" ON "activity_logs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_member" ON "activity_logs" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_logged_at" ON "activity_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_category" ON "activity_logs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_gratitude_household" ON "gratitude_entries" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_gratitude_member" ON "gratitude_entries" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_meal_plans_household" ON "meal_plans" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_meal_plans_date" ON "meal_plans" USING btree ("planned_date");--> statement-breakpoint
CREATE INDEX "idx_mental_health_household" ON "mental_health_resources" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_mental_health_category" ON "mental_health_resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_sleep_logs_household" ON "sleep_logs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_sleep_logs_member" ON "sleep_logs" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_sleep_logs_date" ON "sleep_logs" USING btree ("log_date");--> statement-breakpoint
CREATE INDEX "idx_wellness_checkins_household" ON "wellness_check_ins" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_wellness_checkins_member" ON "wellness_check_ins" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_wellness_checkins_date" ON "wellness_check_ins" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX "idx_advanced_reports_household" ON "advanced_reports" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_advanced_reports_created_by" ON "advanced_reports" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_advanced_reports_type" ON "advanced_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_household" ON "audit_logs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_resource_type" ON "audit_logs" USING btree ("resource_type");--> statement-breakpoint
CREATE INDEX "idx_data_exports_household" ON "data_exports" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_data_exports_requested_by" ON "data_exports" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "idx_data_exports_status" ON "data_exports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_generated_reports_report" ON "generated_reports" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "idx_generated_reports_generated_at" ON "generated_reports" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_household" ON "performance_metrics" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_period" ON "performance_metrics" USING btree ("period");--> statement-breakpoint
CREATE INDEX "idx_performance_metrics_measured_at" ON "performance_metrics" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "idx_community_event_participations_event_id" ON "community_event_participations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_community_event_participations_household_id" ON "community_event_participations" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_community_events_event_type" ON "community_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_community_events_status" ON "community_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_community_events_start_date" ON "community_events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_community_events_organizer_household_id" ON "community_events" USING btree ("organizer_household_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_category" ON "forum_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_author_id" ON "forum_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_created_at" ON "forum_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_forum_replies_post_id" ON "forum_replies" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_forum_replies_author_id" ON "forum_replies" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_friend_connections_requester_household_id" ON "friend_connections" USING btree ("requester_household_id");--> statement-breakpoint
CREATE INDEX "idx_friend_connections_recipient_household_id" ON "friend_connections" USING btree ("recipient_household_id");--> statement-breakpoint
CREATE INDEX "idx_friend_connections_status" ON "friend_connections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_social_challenge_participants_challenge_id" ON "social_challenge_participants" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "idx_social_challenge_participants_household_id" ON "social_challenge_participants" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_social_challenges_status" ON "social_challenges" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_social_challenges_created_by_id" ON "social_challenges" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_social_challenges_start_date" ON "social_challenges" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_social_comments_post_id" ON "social_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_social_comments_author_id" ON "social_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_social_posts_household_id" ON "social_posts" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_social_posts_author_id" ON "social_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_social_posts_share_type" ON "social_posts" USING btree ("share_type");--> statement-breakpoint
CREATE INDEX "idx_social_posts_created_at" ON "social_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_chore_suggestions_household_idx" ON "ai_chore_suggestions" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "ai_chore_suggestions_source_idx" ON "ai_chore_suggestions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "automation_execution_logs_rule_idx" ON "automation_execution_logs" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "automation_execution_logs_triggered_idx" ON "automation_execution_logs" USING btree ("triggered_at");--> statement-breakpoint
CREATE INDEX "idx_automation_rules_household" ON "automation_rules" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "natural_language_commands_household_idx" ON "natural_language_commands" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "natural_language_commands_member_idx" ON "natural_language_commands" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "natural_language_commands_category_idx" ON "natural_language_commands" USING btree ("category");--> statement-breakpoint
CREATE INDEX "predictions_household_idx" ON "predictions" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "predictions_type_idx" ON "predictions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "predictions_member_idx" ON "predictions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "predictive_analytics_configs_household_idx" ON "predictive_analytics_configs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "predictive_insights_household_idx" ON "predictive_insights" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "predictive_insights_severity_idx" ON "predictive_insights" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "schedule_optimizations_household_idx" ON "schedule_optimizations" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "smart_schedule_configs_household_idx" ON "smart_schedule_configs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "suggestion_preferences_household_idx" ON "suggestion_preferences" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "album_photos_album_idx" ON "album_photos" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "album_photos_household_idx" ON "album_photos" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "calendar_connections_household_idx" ON "calendar_connections" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "calendar_connections_member_idx" ON "calendar_connections" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "calendar_events_connection_idx" ON "calendar_events" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "calendar_events_chore_idx" ON "calendar_events" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "calendar_sync_configs_household_idx" ON "calendar_sync_configs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "chat_channels_household_idx" ON "chat_channels" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "chat_channels_type_idx" ON "chat_channels" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_messages_channel_idx" ON "chat_messages" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "chat_messages_sender_idx" ON "chat_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "chat_messages_created_idx" ON "chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "member_unlock_progress_member_idx" ON "member_unlock_progress" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_unlock_progress_household_idx" ON "member_unlock_progress" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "member_unlock_progress_unlock_idx" ON "member_unlock_progress" USING btree ("unlock_id");--> statement-breakpoint
CREATE INDEX "photo_albums_household_idx" ON "photo_albums" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "progressive_unlocks_category_idx" ON "progressive_unlocks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "share_records_achievement_idx" ON "share_records" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "share_settings_household_idx" ON "share_settings" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "shareable_achievements_household_idx" ON "shareable_achievements" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "shareable_achievements_member_idx" ON "shareable_achievements" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "deposit_config_household_idx" ON "allowance_deposit_configs" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "deposit_config_member_idx" ON "allowance_deposit_configs" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "allowance_deposit_household_idx" ON "allowance_deposits" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "allowance_deposit_member_idx" ON "allowance_deposits" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "allowance_deposit_status_idx" ON "allowance_deposits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "banking_conn_household_idx" ON "banking_connections" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "chain_step_chain_idx" ON "chore_chain_steps" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "chain_step_chore_idx" ON "chore_chain_steps" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "chain_household_idx" ON "chore_chains" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "chain_status_idx" ON "chore_chains" USING btree ("status");--> statement-breakpoint
CREATE INDEX "classification_household_idx" ON "chore_classifications" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "classification_chore_idx" ON "chore_classifications" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "rotation_household_idx" ON "chore_rotations" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "rotation_chore_idx" ON "chore_rotations" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "listing_household_idx" ON "marketplace_listings" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "listing_status_idx" ON "marketplace_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listing_chore_idx" ON "marketplace_listings" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "rotation_history_rotation_idx" ON "rotation_history" USING btree ("rotation_id");--> statement-breakpoint
CREATE INDEX "rotation_history_member_idx" ON "rotation_history" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_chore_activity_chore" ON "chore_activity_log" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "idx_chore_activity_created" ON "chore_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_chore_attachments_chore" ON "chore_attachments" USING btree ("chore_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_board_prefs_member_household" ON "chore_board_preferences" USING btree ("member_id","household_id");--> statement-breakpoint
CREATE INDEX "idx_chore_comments_chore" ON "chore_comments" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "idx_chore_comments_member" ON "chore_comments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_saved_filters_household" ON "saved_chore_filters" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_saved_filters_member" ON "saved_chore_filters" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chore_tags_unique" ON "chore_tags" USING btree ("chore_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_chore_tags_chore" ON "chore_tags" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "idx_chore_tags_tag" ON "chore_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tags_household_name" ON "tags" USING btree ("household_id","name");--> statement-breakpoint
CREATE INDEX "idx_tags_household" ON "tags" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_time_logs_chore" ON "time_logs" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "idx_time_logs_member" ON "time_logs" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chore_deps_unique" ON "chore_dependencies" USING btree ("chore_id","depends_on_chore_id");--> statement-breakpoint
CREATE INDEX "idx_chore_deps_chore" ON "chore_dependencies" USING btree ("chore_id");--> statement-breakpoint
CREATE INDEX "idx_chore_deps_depends_on" ON "chore_dependencies" USING btree ("depends_on_chore_id");