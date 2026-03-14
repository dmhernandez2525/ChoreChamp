# ChoreChamp Architecture

**Last Updated:** 2026-02-15

## Overview

ChoreChamp is a monorepo with web, mobile, and API services sharing types, database schema, and UI components. The system is organized around households, members, chores, gamification data, a subscription layer that controls premium access, and an in-app purchase layer for virtual economy flows.

## Core Services

### API (Fastify + Drizzle + PostgreSQL)

- Authentication via better-auth
- REST endpoints under `/api`
- Socket.io for real-time updates
- Subscription services (Stripe web + RevenueCat mobile)

### Web (React + Vite)

- React Router for routing
- TanStack Query for data fetching
- Shared UI components from `@chorechamp/ui`
- Subscription management screen for plan upgrades and billing portal

### Mobile (Expo + React Native)

- Offline-first SQLite cache with Drizzle ORM
- Sync engine for API reconciliation
- RevenueCat integration for in-app subscriptions

## Subscription Architecture (Phase 12.1)

### Data Model

Subscription fields are stored on `households` for fast access and gating:

- Tier (`free`, `family`, `premium`)
- Status (`trialing`, `active`, `past_due`, `grace_period`, `canceled`, `expired`)
- Billing metadata (period start/end, trial, grace period)
- Provider identifiers (Stripe customer/subscription, RevenueCat app user)

### Payment Flows

- **Web**: Stripe Checkout → webhook sync → household subscription update
- **Mobile**: RevenueCat entitlements → sync endpoint → household subscription update

### Entitlement Logic

- Active, trialing, past_due, and grace_period subscriptions retain access
- Expired or canceled subscriptions downgrade to Free for feature gates
- Member limits enforced at member creation + invite acceptance

## In-App Store Architecture (Phase 12.3)

### Data Model

The store system introduces catalog, wallet, purchase, entitlement, refund, and control tables:

- `store_catalog_items`: Item definitions (cosmetics, boosters, card packs, pet items, story chapters, mini-game unlocks, ChoreCoin bundles, gift premium)
- `store_wallets`: Per-member ChoreCoin balance and lifecycle totals
- `store_purchases`: Purchase history + receipt references + approval/refund status
- `store_member_entitlements`: Granted unlocks and temporary boosts
- `store_refund_requests`: Refund workflow state with parent resolution metadata
- `store_purchase_controls`: Parental controls (approval, PIN, spending limits, offer toggles)
- `store_gift_cards`: Gift subscription codes with expiration + redemption status

### Purchase Flows

- **Standard purchase**: Store item request → parental controls validation → coin/point spend → entitlement grant → receipt record
- **Approval flow**: Child purchase request → `pending_parent_approval` purchase → parent approves/declines
- **Bundle flow**: Points spent for ChoreCoin bundles → wallet credited atomically
- **Gift flow**: Parent buys gift card with ChoreCoins → recipient redeems → subscription tier upgraded

### Refund & Receipt Flows

- **Digital receipts**: Every purchase gets a unique receipt number with stored purchase metadata
- **Refund request**: Completed purchase moves to `refund_requested` and creates a refund ticket
- **Resolution**: Parent approves or rejects; approved refunds reverse points/coins and mark purchase `refunded`

## Enterprise School Architecture (Phase 12.4)

### Data Model

School edition introduces district, school, classroom, and governance tables:

- `enterprise_districts`: District-level grouping with contact metadata
- `enterprise_schools`: School profile, branding, FERPA/COPPA toggles, parent visibility defaults
- `enterprise_classrooms` and `enterprise_classroom_students`: Multi-classroom rosters and enrollment links
- `enterprise_assignments` and `enterprise_assignment_submissions`: Teacher workflows for assignment issue, submit, and review
- `enterprise_challenges` and `enterprise_challenge_participations`: School-wide and classroom challenge tracking
- `enterprise_lms_integrations`: Canvas, Google Classroom, and Clever configuration + sync metadata
- `enterprise_parent_visibility`: Per-student visibility controls for guardian access
- `enterprise_bulk_imports`: CSV import audit trail for student/classroom onboarding
- `enterprise_admin_audits`: Administrative audit log across all enterprise operations

### API Flows

- **Admin setup**: Parent creates district/school/classrooms with branding and compliance defaults
- **Roster ops**: Add single students or bulk CSV import, plus CSV export for registrar workflows
- **Assignment loop**: Assign task to classroom, student submits, parent/teacher reviews and scores
- **LMS ops**: Configure provider credentials and execute sync snapshots per school
- **Compliance + governance**: Parent visibility overrides and immutable audit event history
- **Reporting**: Generate downloadable school reports in PDF/Excel payloads

### Web Portal

- New enterprise portal at `/households/:householdId/enterprise`
- Includes school administration dashboards, classroom management, LMS controls, and compliance tools
- Uses shared API-client hooks for typed mutations and cache invalidation

## API Platform & Integrations Architecture (Phase 12.5)

### Data Model

API platform support introduces key management, OAuth, webhook, marketplace, and SDK metadata tables:

- `api_key_settings`: Per-key scope policy and per-minute throttle settings
- `api_key_usage_events`: Request-level usage telemetry for analytics and top-endpoint views
- `webhook_subscriptions` and `webhook_deliveries`: Subscription registry, signed delivery attempts, and response tracking
- `oauth_clients`, `oauth_authorization_codes`, `oauth_access_tokens`: OAuth2 client credentials + authorization code flow support
- `integration_marketplace_apps` and `integration_app_requests`: Third-party app catalog and household approval workflow
- `api_sdk_packages`: Language SDK publication metadata surfaced in the developer portal

### API Surfaces

- **Household developer routes**: `/api/households/:householdId/developer/*`
  - Overview, API key settings, webhook CRUD + emit, marketplace approvals, OAuth client management, SDK package metadata, analytics
- **OAuth routes**: `/api/oauth/*`
  - Authorization code issuance and token exchange
- **Public integration routes**: `/api/public/v1/*`
  - OpenAPI document, household chores/members read APIs, and webhook event emit endpoint

### Access Control + Security

- Parent role is required for developer configuration routes.
- Premium tier is required for developer platform access and OAuth/public token usage.
- Webhook delivery attempts are HMAC-signed and persisted with delivery outcomes.
- API key usage is metered and rate-limited per configured key policy.

### Web Portal

- New developer portal at `/households/:householdId/developer`
- Includes API key creation/settings, webhook management, marketplace approvals, OAuth client registration, SDK registry metadata, and usage analytics
- Uses shared `@chorechamp/api-client` hooks for typed request/response handling

## Accessibility Architecture (Phase 13.1)

### Web Accessibility Layer

- Global `AccessibilityProvider` manages:
  - live region announcements for route and dynamic action feedback
  - persisted high contrast preference
  - persisted reduced motion preference (plus system preference alignment)
- `AppShell` provides:
  - keyboard `Skip to main content` link
  - route-change announcement and focus handoff to primary heading
  - labeled navigation landmarks for mobile navigation structures
- Stylesheet accessibility mode support:
  - high contrast palette override (`data-high-contrast='true'`)
  - reduced motion override (`data-reduced-motion='true'`) and `prefers-reduced-motion` handling
  - consistent `:focus-visible` outlines

### Mobile Accessibility Layer

- Bottom tab navigation includes explicit VoiceOver/TalkBack labels and hints.
- Chore list rows expose accessibility actions (`activate`, `complete`) for assistive technology custom actions.
- Filter/search controls include explicit labels, selected state, and hints to improve Voice Access discoverability.

## Task Management Views Architecture (Phase 15)

### Overview

Advanced task management views ported from Command Center UI, adapted for the chore management domain. Adds Kanban board, calendar, sortable list, bulk actions, filters, command palette, enhanced detail panel, automation rules, and undo/redo to the existing chore management system.

### View System

Four interchangeable views share a common filter/sort/grouping state:

- **Kanban Board**: Drag-and-drop columns (To Do, In Progress, Done, Verified) with optional swimlane grouping by member, category, or priority. Uses @dnd-kit.
- **Calendar View**: Month/week grid with chore chips. Drag to reschedule. Unscheduled sidebar.
- **List View**: Sortable table with inline editing via @tanstack/react-table. Keyboard-navigable.
- **Dashboard** (existing): Summary cards, stats, and today's chores.

### State Management

New Zustand stores (persisted to localStorage):

- `view-store`: active view mode, filters, sort, group-by, selected chore IDs, saved views
- `filter-store`: quick filter values, advanced filter conditions, URL search param sync
- `bulk-action-store`: selected IDs, selection mode, last action reference
- `undo-store`: action stack (max 20), redo stack, push/pop/clear

### Data Model Extensions

New database tables (Drizzle ORM):

- `chore_board_preferences`: Per-member view mode, column settings, saved filters, grouping/sort defaults
- `chore_comments`: Chore-level comments with @mention support and soft delete
- `chore_attachments`: File metadata linked to chores (integrates with photo proof)
- `chore_activity_log`: Audit trail of all chore changes (status, assignment, edits)
- `saved_chore_filters`: Named filter/sort/group configurations with private/household visibility

Extended columns on `chores`: `priority`, `board_order`

### API Extensions

New route files: `board.ts`, `bulk-actions.ts`, `chore-comments.ts`, `chore-attachments.ts`, `chore-activity.ts`, `calendar.ts`, `saved-filters.ts`

Extended: `chores.ts` with sort/filter/search query params

### Key Libraries Added

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (drag-and-drop)
- `@tanstack/react-table` (sortable table)
- `cmdk` (command palette)

### SDDs

- SDD-025: Kanban Board View
- SDD-026: Calendar View
- SDD-027: List View
- SDD-028: Bulk Actions
- SDD-029: Advanced Filters
- SDD-030: Command Palette
- SDD-031: Enhanced Chore Detail Panel
- SDD-032: Automation Rules
- SDD-033: Undo/Redo

### Acceptance Criteria

175 testable criteria in `docs/AC-TASK-MANAGEMENT.md`

## Shared Packages

- `@chorechamp/types`: Shared contracts for subscriptions, in-app store, enterprise school workflows, API platform integrations, and core product domains
- `@chorechamp/database`: Drizzle schema, enterprise tables, API platform tables, and seed data
- `@chorechamp/api-client`: Typed client + React Query hooks for subscription, store, enterprise, and developer platform modules
