# SDD-001: Authentication System

**Status:** Draft
**Priority:** P0 (MVP)
**Author:** ChoreChamp Team
**Last Updated:** 2026-01-28

---

## 1. Overview

### 1.1 Purpose
Implement a secure, COPPA-compliant authentication system supporting parent accounts with child profile management. Parents authenticate; children access through parent-controlled profiles.

### 1.2 Scope
- Parent account creation and authentication
- OAuth integration (Google, Apple)
- Session management
- Password reset flow
- Child profile management (no independent child accounts)
- COPPA parental consent verification

### 1.3 Research Justification
- **COPPA 2025:** Requires parent accounts to control child profiles; children cannot have independent accounts
- **Value-before-signup:** Duolingo's A/B test showed +20% DAU by deferring signup

---

## 2. Architecture

### 2.1 Technology Stack
- **Auth Library:** better-auth
- **Database:** PostgreSQL via Drizzle ORM
- **Session Store:** Redis
- **Password Hashing:** Argon2id (better-auth default)
- **JWT:** For API authentication

### 2.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Apps                          │
│  (Web, iOS, Android, macOS, Windows)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Server                             │
│                      (Fastify)                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   better-auth   │  │   Auth Routes   │                  │
│  │   (Core Auth)   │  │   /api/auth/*   │                  │
│  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                            │
│           ▼                    ▼                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Session Management                      │   │
│  │              (Redis + JWT)                          │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  users   │  │ sessions │  │ accounts │  │ consents │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Accounts Table (OAuth)
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'email', 'google', 'apple'
  provider_account_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);
```

### 3.3 Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 COPPA Consents Table
```sql
CREATE TABLE coppa_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'credit_card', 'government_id', 'knowledge_based'
  verified_at TIMESTAMPTZ NOT NULL,
  verification_metadata JSONB, -- Store verification details
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Password Reset Tokens
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. API Endpoints

### 4.1 Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/signin` | Sign in with credentials |
| POST | `/api/auth/signout` | Sign out, invalidate session |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/verify-email` | Verify email address |

### 4.2 OAuth Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/apple` | Initiate Apple Sign-In |
| POST | `/api/auth/apple/callback` | Apple Sign-In callback |

### 4.3 COPPA Consent Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/coppa/verify` | Submit COPPA verification |
| GET | `/api/auth/coppa/status` | Check verification status |

---

## 5. Authentication Flows

### 5.1 Email/Password Signup

```
Client                    API                     Database
  │                        │                         │
  ├─ POST /signup ────────►│                         │
  │  {email, password}     │                         │
  │                        ├─ Validate input ───────►│
  │                        │                         │
  │                        ├─ Hash password ─────────│
  │                        │  (Argon2id)             │
  │                        │                         │
  │                        ├─ Create user ──────────►│
  │                        │                         │
  │                        ├─ Create session ───────►│
  │                        │                         │
  │                        ├─ Send verification ────►│ (Email)
  │                        │                         │
  │◄─ 201 {user, session} ─┤                         │
  │                        │                         │
```

### 5.2 Value-Before-Signup Flow

```
Client                    API                     Database
  │                        │                         │
  │  (User creates chores, │                         │
  │   family without       │                         │
  │   authentication)      │                         │
  │                        │                         │
  ├─ Store locally ────────│                         │
  │                        │                         │
  │  ... User decides to   │                         │
  │      save progress ... │                         │
  │                        │                         │
  ├─ POST /signup ────────►│                         │
  │  {email, password,     │                         │
  │   localData}           │                         │
  │                        ├─ Create user ──────────►│
  │                        │                         │
  │                        ├─ Import local data ────►│
  │                        │  (chores, family)       │
  │                        │                         │
  │◄─ 201 {user, session} ─┤                         │
  │                        │                         │
```

### 5.3 Google OAuth Flow

```
Client                    API                      Google
  │                        │                         │
  ├─ GET /auth/google ────►│                         │
  │                        ├─ Redirect ─────────────►│
  │◄────────────────────────────────────────────────┤
  │                        │                         │
  │  (User authenticates   │                         │
  │   with Google)         │                         │
  │                        │                         │
  ├─ Callback ────────────►│◄─ Token ───────────────┤
  │                        │                         │
  │                        ├─ Verify token           │
  │                        │                         │
  │                        ├─ Create/link user ─────►│ (DB)
  │                        │                         │
  │◄─ Redirect w/ session ─┤                         │
  │                        │                         │
```

---

## 6. Security Considerations

### 6.1 Password Requirements
- Minimum 8 characters
- No maximum length (bcrypt handles truncation)
- Check against common password list (top 10,000)
- Rate limit: 5 failed attempts, then 15-minute lockout

### 6.2 Session Security
- Sessions stored in Redis with 7-day expiry
- JWT access tokens with 15-minute expiry
- Refresh tokens with 30-day expiry
- HttpOnly, Secure, SameSite=Strict cookies
- Automatic session invalidation on password change

### 6.3 COPPA Compliance
- Children under 13 cannot create accounts
- Parent accounts required to manage child profiles
- Verifiable parental consent before adding children
- Consent methods: Credit card verification, government ID
- Data retention limited to necessary purposes

### 6.4 Rate Limiting
| Endpoint | Limit |
|----------|-------|
| `/signup` | 5/hour per IP |
| `/signin` | 10/minute per IP |
| `/forgot-password` | 3/hour per email |
| `/verify-email` | 10/hour per IP |

---

## 7. Implementation

### 7.1 better-auth Configuration

```typescript
// apps/api/src/plugins/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@chorechamp/database';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  rateLimit: {
    window: 60, // 1 minute
    max: 100,
  },
});
```

### 7.2 Fastify Integration

```typescript
// apps/api/src/routes/auth/index.ts
import { FastifyPluginAsync } from 'fastify';
import { auth } from '../../plugins/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Mount better-auth routes
  fastify.all('/api/auth/*', async (request, reply) => {
    return auth.handler(request.raw, reply.raw);
  });

  // Custom COPPA verification endpoint
  fastify.post('/api/auth/coppa/verify', {
    schema: {
      body: CoppaVerificationSchema,
    },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    // Implementation
  });
};

export default authRoutes;
```

### 7.3 Client-Side Integration

```typescript
// packages/api-client/src/auth.ts
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: process.env.API_URL,
});

// Usage in React
export function useAuth() {
  const session = authClient.useSession();

  return {
    user: session.data?.user,
    isLoading: session.isLoading,
    signIn: authClient.signIn.email,
    signUp: authClient.signUp.email,
    signOut: authClient.signOut,
    signInWithGoogle: authClient.signIn.social({ provider: 'google' }),
    signInWithApple: authClient.signIn.social({ provider: 'apple' }),
  };
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Password hashing and verification
- Token generation and validation
- Input validation schemas

### 8.2 Integration Tests
- Full signup flow
- Full signin flow
- OAuth flow (mocked providers)
- Password reset flow
- Session refresh flow

### 8.3 E2E Tests
- Complete authentication journey
- Protected route access
- Session expiration handling

---

## 9. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password | 401 |
| `AUTH_EMAIL_EXISTS` | Email already registered | 409 |
| `AUTH_EMAIL_NOT_VERIFIED` | Please verify your email | 403 |
| `AUTH_SESSION_EXPIRED` | Session has expired | 401 |
| `AUTH_RATE_LIMITED` | Too many attempts | 429 |
| `AUTH_COPPA_REQUIRED` | Parental consent required | 403 |

---

## 10. Monitoring & Metrics

### 10.1 Key Metrics
- Signup success rate
- Signin success rate
- OAuth conversion rate
- Session duration average
- Password reset completion rate

### 10.2 Alerts
- Failed login spike (>10x normal)
- Signup error rate >5%
- OAuth provider errors

---

## 11. Dependencies

### 11.1 External Services
- Google OAuth API
- Apple Sign-In API
- Email service (for verification, password reset)

### 11.2 Internal Packages
- `@chorechamp/database` - Drizzle schema
- `@chorechamp/types` - Shared types

---

## 12. Open Questions

1. **COPPA verification provider:** Which third-party service for ID verification?
2. **Apple Sign-In on web:** Handle web-based Apple auth flow
3. **Session device limits:** Max concurrent sessions per user?

---

**Document Version:** 1.0.0
**Next Review:** After Phase 1 implementation
