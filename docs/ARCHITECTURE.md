# ChoreChamp Architecture

**Last Updated:** 2026-02-03

## Overview
ChoreChamp is a monorepo with web, mobile, and API services sharing types, database schema, and UI components. The system is organized around households, members, chores, and gamification data, with a subscription layer that controls premium access.

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

## Shared Packages
- `@chorechamp/types`: Subscription types shared across apps
- `@chorechamp/database`: Drizzle schema and seed data
- `@chorechamp/api-client`: Typed client + React Query hooks
