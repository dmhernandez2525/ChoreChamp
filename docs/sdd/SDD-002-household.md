# SDD-002: Household Management

**Status:** Draft
**Priority:** P0 (MVP)
**Author:** ChoreChamp Team
**Last Updated:** 2026-01-28

---

## 1. Overview

### 1.1 Purpose
Implement household and family member management, allowing parents to create households, invite members, and manage child profiles without requiring children to have their own accounts.

### 1.2 Scope
- Household creation with auto-generated invite codes
- Member invitation and joining
- Role-based permissions (Parent, Child, Teen, Viewer)
- Parent-managed child profiles
- Multiple household support
- Household settings and configuration

### 1.3 Research Justification
- **Parent-managed child accounts:** OurHome's most praised feature; COPPA compliance
- **Multiple households:** Support divorced family use case
- **Role-based access:** Different capabilities for parents vs children

---

## 2. Architecture

### 2.1 Entity Relationships

```
┌──────────────┐
│    User      │  (Authenticated parent/adult)
│   (users)    │
└──────┬───────┘
       │
       │ 1:N
       ▼
┌──────────────┐         ┌──────────────┐
│  Household   │◄───────►│   Member     │
│ (households) │   1:N   │  (members)   │
└──────────────┘         └──────────────┘
       │                        │
       │ 1:N                    │ 0:1
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│ Invite Code  │         │    User      │
│(invite_codes)│         │  (optional)  │
└──────────────┘         └──────────────┘
```

---

## 3. Database Schema

### 3.1 Households Table
```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  week_starts_on SMALLINT DEFAULT 0, -- 0=Sunday, 1=Monday
  points_name VARCHAR(50) DEFAULT 'Stars',
  currency VARCHAR(3) DEFAULT 'USD',

  -- Subscription
  subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'premium'
  subscription_expires_at TIMESTAMPTZ,
  subscription_provider VARCHAR(20), -- 'apple', 'google', 'stripe'

  -- Stats (denormalized for performance)
  total_chores_completed INTEGER DEFAULT 0,
  current_family_streak INTEGER DEFAULT 0,
  longest_family_streak INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_households_created_by ON households(created_by);
```

### 3.2 Members Table
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- NULL for child profiles managed by parent

  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'parent', 'child', 'teen', 'viewer'
  color VARCHAR(7) NOT NULL, -- Hex color code
  avatar_url TEXT,
  birth_year SMALLINT, -- For age-appropriate features

  -- Points
  points_current INTEGER DEFAULT 0,
  points_lifetime INTEGER DEFAULT 0,

  -- Streaks
  streak_current INTEGER DEFAULT 0,
  streak_longest INTEGER DEFAULT 0,
  streak_last_completed_date DATE,
  streak_freezes_available INTEGER DEFAULT 1,
  streak_freezes_used INTEGER DEFAULT 0,

  -- Badges (array of badge IDs)
  badges TEXT[] DEFAULT '{}',

  -- Settings
  can_redeem_rewards BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT TRUE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(household_id, user_id) -- One user per household
);

CREATE INDEX idx_members_household ON members(household_id);
CREATE INDEX idx_members_user ON members(user_id);
```

### 3.3 Invite Codes Table
```sql
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  code VARCHAR(8) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'child', -- Role assigned on join
  created_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_household ON invite_codes(household_id);
```

### 3.4 User Households Junction (for multiple households)
```sql
CREATE TABLE user_households (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, household_id)
);
```

---

## 4. API Endpoints

### 4.1 Household Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/households` | Create household | Required |
| GET | `/api/households` | List user's households | Required |
| GET | `/api/households/:id` | Get household details | Member |
| PATCH | `/api/households/:id` | Update household | Parent |
| DELETE | `/api/households/:id` | Delete household | Owner |

### 4.2 Member Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/households/:id/members` | List members | Member |
| POST | `/api/households/:id/members` | Add child profile | Parent |
| GET | `/api/households/:id/members/:memberId` | Get member | Member |
| PATCH | `/api/households/:id/members/:memberId` | Update member | Parent/Self |
| DELETE | `/api/households/:id/members/:memberId` | Remove member | Parent |

### 4.3 Invite Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/households/:id/invites` | Create invite code | Parent |
| GET | `/api/households/:id/invites` | List active invites | Parent |
| DELETE | `/api/households/:id/invites/:code` | Revoke invite | Parent |
| POST | `/api/invites/join` | Join via invite code | Required |
| GET | `/api/invites/:code/preview` | Preview household | Public |

---

## 5. Request/Response Schemas

### 5.1 Create Household

**Request:**
```typescript
interface CreateHouseholdRequest {
  name: string;           // 1-100 chars
  timezone?: string;      // IANA timezone
  weekStartsOn?: number;  // 0-6
  pointsName?: string;    // Custom name for points
}
```

**Response:**
```typescript
interface CreateHouseholdResponse {
  household: Household;
  member: Member;        // Creator's member record
  inviteCode: string;    // Auto-generated invite code
}
```

### 5.2 Add Child Profile

**Request:**
```typescript
interface AddChildRequest {
  name: string;          // 1-100 chars
  birthYear?: number;    // For age-appropriate features
  color: string;         // Hex color
  avatarUrl?: string;
  requiresApproval?: boolean;
}
```

**Response:**
```typescript
interface AddChildResponse {
  member: Member;
}
```

### 5.3 Join Household

**Request:**
```typescript
interface JoinHouseholdRequest {
  code: string;          // 8-char invite code
}
```

**Response:**
```typescript
interface JoinHouseholdResponse {
  household: Household;
  member: Member;
}
```

---

## 6. Business Logic

### 6.1 Invite Code Generation
```typescript
function generateInviteCode(): string {
  // Generate 8-character alphanumeric code
  // Exclude confusing characters: 0, O, I, l
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

### 6.2 Role Permissions

| Action | Parent | Teen | Child | Viewer |
|--------|--------|------|-------|--------|
| View household | ✅ | ✅ | ✅ | ✅ |
| Create chores | ✅ | ❌ | ❌ | ❌ |
| Edit chores | ✅ | ❌ | ❌ | ❌ |
| Complete own chores | ✅ | ✅ | ✅ | ❌ |
| Approve completions | ✅ | ❌ | ❌ | ❌ |
| Add members | ✅ | ❌ | ❌ | ❌ |
| Create rewards | ✅ | ❌ | ❌ | ❌ |
| Redeem rewards | ✅ | ✅ | ✅* | ❌ |
| View analytics | ✅ | ✅ | ❌ | ❌ |
| Manage settings | ✅ | ❌ | ❌ | ❌ |

*Children can request reward redemption; parent approves

### 6.3 Color Assignment
Pre-defined color palette for family members:
```typescript
const MEMBER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];

function getNextAvailableColor(existingColors: string[]): string {
  for (const color of MEMBER_COLORS) {
    if (!existingColors.includes(color)) {
      return color;
    }
  }
  // If all colors used, return first color
  return MEMBER_COLORS[0];
}
```

### 6.4 Multiple Household Limits
| Subscription | Max Households |
|--------------|----------------|
| Free | 1 |
| Premium | 5 |

---

## 7. Implementation

### 7.1 Service Layer

```typescript
// apps/api/src/services/household.service.ts
import { db } from '@chorechamp/database';
import { households, members, inviteCodes } from '@chorechamp/database/schema';

export class HouseholdService {
  async createHousehold(userId: string, data: CreateHouseholdRequest) {
    return db.transaction(async (tx) => {
      // Create household
      const [household] = await tx.insert(households).values({
        name: data.name,
        createdBy: userId,
        timezone: data.timezone || 'America/New_York',
        weekStartsOn: data.weekStartsOn || 0,
        pointsName: data.pointsName || 'Stars',
      }).returning();

      // Create creator as parent member
      const [member] = await tx.insert(members).values({
        householdId: household.id,
        userId,
        name: 'Parent', // Will be updated with user's name
        role: 'parent',
        color: MEMBER_COLORS[0],
        requiresApproval: false,
      }).returning();

      // Generate invite code
      const code = generateInviteCode();
      await tx.insert(inviteCodes).values({
        householdId: household.id,
        code,
        role: 'child',
        createdBy: userId,
      });

      // Link user to household
      await tx.insert(userHouseholds).values({
        userId,
        householdId: household.id,
      });

      return { household, member, inviteCode: code };
    });
  }

  async addChildProfile(householdId: string, parentId: string, data: AddChildRequest) {
    // Verify parent is member with parent role
    const parent = await this.verifyParentAccess(householdId, parentId);
    if (!parent) throw new ForbiddenError('Not authorized');

    // Get existing colors
    const existingMembers = await db.query.members.findMany({
      where: eq(members.householdId, householdId),
    });
    const existingColors = existingMembers.map(m => m.color);

    const [member] = await db.insert(members).values({
      householdId,
      userId: null, // No user account for children
      name: data.name,
      role: 'child',
      color: data.color || getNextAvailableColor(existingColors),
      avatarUrl: data.avatarUrl,
      birthYear: data.birthYear,
      requiresApproval: data.requiresApproval ?? true,
    }).returning();

    return member;
  }

  async joinHousehold(userId: string, code: string) {
    const invite = await db.query.inviteCodes.findFirst({
      where: and(
        eq(inviteCodes.code, code.toUpperCase()),
        eq(inviteCodes.isActive, true),
      ),
    });

    if (!invite) throw new NotFoundError('Invalid invite code');
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestError('Invite code has expired');
    }
    if (invite.maxUses && invite.useCount >= invite.maxUses) {
      throw new BadRequestError('Invite code has reached max uses');
    }

    return db.transaction(async (tx) => {
      // Create member
      const [member] = await tx.insert(members).values({
        householdId: invite.householdId,
        userId,
        name: 'New Member', // Will be updated
        role: invite.role,
        color: await getNextAvailableColor(invite.householdId),
      }).returning();

      // Increment use count
      await tx.update(inviteCodes)
        .set({ useCount: invite.useCount + 1 })
        .where(eq(inviteCodes.id, invite.id));

      // Link user to household
      await tx.insert(userHouseholds).values({
        userId,
        householdId: invite.householdId,
      });

      const household = await tx.query.households.findFirst({
        where: eq(households.id, invite.householdId),
      });

      return { household, member };
    });
  }
}
```

### 7.2 Route Handlers

```typescript
// apps/api/src/routes/households/index.ts
import { FastifyPluginAsync } from 'fastify';
import { HouseholdService } from '../../services/household.service';

const householdService = new HouseholdService();

const householdRoutes: FastifyPluginAsync = async (fastify) => {
  // Create household
  fastify.post('/', {
    schema: { body: CreateHouseholdSchema },
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const result = await householdService.createHousehold(
      request.user.id,
      request.body
    );
    return reply.status(201).send(result);
  });

  // Get user's households
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const households = await householdService.getUserHouseholds(request.user.id);
    return { households };
  });

  // Add child profile
  fastify.post('/:id/members', {
    schema: { body: AddChildSchema },
    preHandler: [fastify.authenticate, fastify.requireHouseholdParent],
  }, async (request, reply) => {
    const member = await householdService.addChildProfile(
      request.params.id,
      request.user.id,
      request.body
    );
    return reply.status(201).send({ member });
  });
};

export default householdRoutes;
```

---

## 8. Real-Time Updates

### 8.1 Socket.io Events

| Event | Payload | Description |
|-------|---------|-------------|
| `member:joined` | `{ member }` | New member joined household |
| `member:updated` | `{ member }` | Member profile updated |
| `member:removed` | `{ memberId }` | Member removed |
| `household:updated` | `{ household }` | Settings changed |

### 8.2 Room Structure
```typescript
// Each household has a room
socket.join(`household:${householdId}`);

// Emit to all household members
io.to(`household:${householdId}`).emit('member:joined', { member });
```

---

## 9. Testing Strategy

### 9.1 Unit Tests
- Invite code generation uniqueness
- Role permission checks
- Color assignment logic

### 9.2 Integration Tests
- Create household flow
- Join household flow
- Add child profile flow
- Member removal

### 9.3 E2E Tests
- Complete family setup journey
- Multi-household management

---

## 10. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `HOUSEHOLD_NOT_FOUND` | Household not found | 404 |
| `HOUSEHOLD_LIMIT_REACHED` | Maximum households reached | 403 |
| `INVITE_INVALID` | Invalid invite code | 400 |
| `INVITE_EXPIRED` | Invite code has expired | 400 |
| `INVITE_MAX_USES` | Invite code max uses reached | 400 |
| `MEMBER_EXISTS` | Already a member of this household | 409 |
| `NOT_PARENT` | Parent access required | 403 |

---

## 11. Security Considerations

- Invite codes are case-insensitive
- Invite codes can have expiration and use limits
- Only parents can add child profiles
- Only parents can modify household settings
- Members can only access their own households
- User ID checked against member records for all operations

---

**Document Version:** 1.0.0
**Next Review:** After Phase 1 implementation
