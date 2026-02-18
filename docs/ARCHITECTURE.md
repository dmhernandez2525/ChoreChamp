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

## Shared Packages
- `@chorechamp/types`: Shared contracts for subscriptions, in-app store, and core product domains
- `@chorechamp/database`: Drizzle schema and seed data
- `@chorechamp/api-client`: Typed client + React Query hooks
