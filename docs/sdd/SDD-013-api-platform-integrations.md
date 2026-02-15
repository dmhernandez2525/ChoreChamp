# SDD-013: API Platform & Integrations

**Status:** Implemented (Phase 12.5)
**Priority:** P1
**Last Updated:** 2026-02-15

---

## 1. Overview

### 1.1 Purpose

Deliver a production-grade developer platform for ChoreChamp with public API access, webhook delivery, OAuth2 authorization, integration marketplace workflows, and SDK publication metadata.

### 1.2 Scope

- Public REST endpoints with OpenAPI contract
- OAuth2 authorization code + token exchange support
- API key scope/rate-limit controls and usage telemetry
- Webhook subscription management and signed event deliveries
- Integration marketplace request + parent approval workflow
- SDK package registry metadata for JavaScript, Python, Swift, and Kotlin
- Developer portal UX for managing all of the above

### 1.3 Out of Scope

- End-user self-service external app billing contracts
- Background webhook retry queues with exponential backoff workers
- OAuth refresh tokens and long-lived delegated sessions

---

## 2. Domain Model

### 2.1 Core Entities

- `api_key_settings`
- `api_key_usage_events`
- `webhook_subscriptions`
- `webhook_deliveries`
- `oauth_clients`
- `oauth_authorization_codes`
- `oauth_access_tokens`
- `integration_marketplace_apps`
- `integration_app_requests`
- `api_sdk_packages`

### 2.2 Key Relationships

- One API key has one settings record and many usage events.
- One webhook subscription has many delivery attempts.
- One OAuth client has many auth codes and access tokens.
- One household can request many marketplace apps, one request per app.
- SDK package metadata is keyed by language for a single active package entry.

---

## 3. API Design

### 3.1 Route Prefixes

- Household developer routes: `/api/households/:householdId/developer/*`
- OAuth routes: `/api/oauth/*`
- Public API routes: `/api/public/v1/*`

### 3.2 Endpoint Groups

- Developer overview and OpenAPI
  - `GET /developer/overview`
  - `GET /developer/openapi`
- API key governance
  - `GET /developer/api-keys`
  - `PATCH /developer/api-keys/:keyId/settings`
  - `GET /developer/api-keys/:keyId/usage`
- Webhooks
  - `GET /developer/webhooks`
  - `POST /developer/webhooks`
  - `PATCH /developer/webhooks/:subscriptionId`
  - `POST /developer/webhooks/emit`
  - `GET /developer/webhooks/deliveries`
- Marketplace workflow
  - `GET /developer/marketplace/apps`
  - `GET /developer/marketplace/requests`
  - `POST /developer/marketplace/requests`
  - `POST /developer/marketplace/requests/:requestId/review`
- OAuth clients and SDK distribution
  - `GET /developer/oauth/clients`
  - `POST /developer/oauth/clients`
  - `GET /developer/sdk-packages`
  - `POST /developer/sdk-packages`
- Analytics
  - `GET /developer/analytics`
- OAuth2 authorization flow
  - `POST /api/oauth/authorize`
  - `POST /api/oauth/token`
- Public API
  - `GET /api/public/v1/openapi.json`
  - `GET /api/public/v1/households/:householdId/chores`
  - `GET /api/public/v1/households/:householdId/members`
  - `POST /api/public/v1/households/:householdId/events/:eventType`

### 3.3 Authorization Rules

- Parent role required for developer administration endpoints.
- Premium subscription required for developer platform and OAuth/public usage.
- Public endpoints require either API key or OAuth bearer token.
- Scope checks enforced per endpoint capability (`chores:read`, `members:read`, `webhooks:write`, etc.).

---

## 4. Security & Reliability

### 4.1 API Key Controls

- API keys are stored hashed and never returned in raw form after creation.
- Per-key scopes and rate limits are configurable by parent users.
- Request usage is recorded with status code and response time for auditing.

### 4.2 OAuth Controls

- Authorization codes expire quickly and are single-use.
- Access tokens are stored hashed and validated against expiration/revocation.
- Redirect URI and client scope validation are enforced at exchange time.

### 4.3 Webhook Delivery

- Payloads are signed via HMAC and include event metadata.
- Delivery attempts store response status/body and final state.
- Subscription failure counters and last-triggered timestamps are tracked.

---

## 5. Web & SDK Surfaces

### 5.1 Developer Portal Route

`/households/:householdId/developer`

### 5.2 Portal Modules

- API key creation, scope tuning, and rate-limit policy edits
- Usage event inspection per key
- Webhook subscription creation, status control, and test-event emission
- Marketplace app request and parent approval actions
- OAuth client registration with one-time secret display
- SDK package metadata publish/update controls
- OpenAPI JSON viewer and copy workflow

### 5.3 SDK Packages

- `sdk/javascript` (`@chorechamp/sdk-js`)
- `sdk/python` (`chorechamp-sdk`)
- `sdk/swift` (`ChoreChampSDK`)
- `sdk/kotlin` (`com.chorechamp:sdk-kotlin`)

Each SDK provides helpers for OpenAPI fetch, household chore/member reads, and webhook event emit.

---

## 6. Testing & Validation

### 6.1 Implemented Tests

- `apps/api/src/routes/api-platform.test.ts`
  - OpenAPI contract includes auth schemes and integration paths
  - OAuth token URL in contract points at `/api/oauth/token`

### 6.2 Validation Commands

- `../../node_modules/.bin/tsc --noEmit` in:
  - `packages/api-client`
  - `apps/api`
  - `apps/web`
- `node_modules/.bin/vitest run src/routes/api-platform.test.ts src/routes/enterprise-school.test.ts src/routes/in-app-store.test.ts src/routes/subscription.test.ts src/routes/rewards.test.ts` in `apps/api`

---

## 7. Risks and Follow-ups

### 7.1 Current Risks

- Webhook retries are currently immediate/manual and not queue-backed.
- OAuth currently issues access tokens only (no refresh token flow).
- SDK packages are source-published in-repo and not yet automated to package registries.

### 7.2 Recommended Next Enhancements

- Add background retry worker with dead-letter handling for webhook failures.
- Add OAuth refresh token rotation + token revocation endpoints.
- Add registry publish automation (npm, PyPI, Swift package tagging, Maven Central workflow).
