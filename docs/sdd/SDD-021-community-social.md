# SDD-021: Community & Social Features (Phase 16)

**Status:** Implemented
**Date:** 2026-02-15
**Phase:** 16
**Features:** F16.1-F16.5

---

## 1. Overview

Phase 16 introduces community and social features to ChoreChamp, enabling users to connect with others, share achievements, participate in challenges, and engage in community events. This phase consists of five integrated features:

- **F16.1 Community Forums**: Discussion boards with categorized posts, replies, likes, and search, allowing families to share tips and ask questions.
- **F16.2 Social Challenges**: Competitive, collaborative, and milestone-based challenges that families can create, join, and track progress on.
- **F16.3 Social Sharing & Feed**: A social feed where users can share achievements, milestones, streaks, and badges with configurable visibility controls.
- **F16.4 Friend System**: Send, accept, and manage friend connections with suggestions, enabling cross-household social interactions.
- **F16.5 Community Events**: Create and join local community events such as cleanups, fundraisers, workshops, and competitions.

These features are unified through a CommunityHub page with a tabbed interface, shared API endpoints under the community prefix, and coordinated database schema.

---

## 2. Architecture

### 2.1 Database Schema

All community and social data is stored in `packages/database/src/schema/community-social.ts` with the following tables:

#### forumPosts
```typescript
{
  id: string (primary key)
  householdId: string (foreign key)
  authorId: string (foreign key)
  title: string
  content: string
  category: ForumCategory
  tags: string[] (JSON)
  isPinned: boolean
  isLocked: boolean
  likeCount: number
  replyCount: number
  viewCount: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### forumReplies
```typescript
{
  id: string (primary key)
  postId: string (foreign key -> forumPosts)
  authorId: string (foreign key)
  content: string
  parentReplyId: string | null (self-referencing)
  likeCount: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### socialChallenges
```typescript
{
  id: string (primary key)
  householdId: string (foreign key)
  creatorId: string (foreign key)
  title: string
  description: string
  challengeType: SocialChallengeType
  status: SocialChallengeStatus
  startDate: timestamp
  endDate: timestamp
  goal: JSON
  reward: JSON
  maxParticipants: number | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### socialChallengeParticipants
```typescript
{
  id: string (primary key)
  challengeId: string (foreign key -> socialChallenges)
  memberId: string (foreign key)
  progress: number
  joinedAt: timestamp
  completedAt: timestamp | null
}
```

#### socialPosts
```typescript
{
  id: string (primary key)
  authorId: string (foreign key)
  householdId: string (foreign key)
  content: string
  shareType: ShareType
  visibility: ShareVisibility
  imageUrl: string | null
  referenceId: string | null
  likeCount: number
  commentCount: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### socialComments
```typescript
{
  id: string (primary key)
  postId: string (foreign key -> socialPosts)
  authorId: string (foreign key)
  content: string
  likeCount: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### friendConnections
```typescript
{
  id: string (primary key)
  requesterId: string (foreign key)
  targetId: string (foreign key)
  status: FriendRequestStatus
  message: string | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### communityEvents
```typescript
{
  id: string (primary key)
  householdId: string (foreign key)
  creatorId: string (foreign key)
  title: string
  description: string
  eventType: CommunityEventType
  status: CommunityEventStatus
  startDate: timestamp
  endDate: timestamp | null
  location: string
  maxParticipants: number | null
  participantCount: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### communityEventParticipations
```typescript
{
  id: string (primary key)
  eventId: string (foreign key -> communityEvents)
  memberId: string (foreign key)
  joinedAt: timestamp
  role: string
}
```

### 2.2 API Routes

All endpoints are registered under `/:householdId/community` in `apps/api/src/routes/community-social.ts`.

#### Forum Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/forums` | List forum posts with pagination and category filter |
| POST | `/forums` | Create a new forum post |
| GET | `/forums/:postId` | Get a single forum post with replies |
| POST | `/forums/:postId/replies` | Add a reply to a post |
| POST | `/forums/:postId/like` | Like or unlike a forum post |
| DELETE | `/forums/:postId` | Delete a forum post |

#### Social Challenge Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/challenges` | List social challenges |
| POST | `/challenges` | Create a new social challenge |
| GET | `/challenges/:challengeId` | Get challenge details |
| POST | `/challenges/:challengeId/join` | Join a challenge |
| PUT | `/challenges/:challengeId/progress` | Update challenge progress |

#### Social Feed Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/feed` | Get social feed with visibility filtering |
| POST | `/posts` | Create a social post |
| GET | `/posts/:postId` | Get a social post with comments |
| POST | `/posts/:postId/comments` | Add a comment to a post |
| POST | `/posts/:postId/like` | Like or unlike a social post |
| DELETE | `/posts/:postId` | Delete a social post |

#### Friend Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/friends` | List friends and pending requests |
| POST | `/friends/request` | Send a friend request |
| PUT | `/friends/:connectionId` | Accept, decline, or block a friend request |
| DELETE | `/friends/:connectionId` | Remove a friend connection |
| GET | `/friends/suggestions` | Get friend suggestions |

#### Community Event Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/events` | List community events |
| POST | `/events` | Create a community event |
| GET | `/events/:eventId` | Get event details |
| POST | `/events/:eventId/join` | Join an event |
| PUT | `/events/:eventId` | Update an event |
| DELETE | `/events/:eventId` | Delete an event |

### 2.3 Frontend Components

The `CommunityHub` page (`apps/web/src/pages/CommunityHub.tsx`) provides a 5-tab interface:

1. **Forums** - Category filters, post listing, new post creation
2. **Challenges** - Challenge stats, type filters, challenge cards
3. **Social** - Social feed with visibility filters, post sharing
4. **Friends** - Friend search, pending requests, friend list, suggestions
5. **Events** - Event type filters, event listing, participation stats

### 2.4 API Client Integration

The `ApiClient` class (`packages/api-client/src/client.ts`) includes ~25 methods for community features, and corresponding React Query hooks are provided in `packages/api-client/src/hooks/index.ts`.

---

## 3. Type Definitions

All types are defined in `packages/types/src/community-social.ts`:

- **ForumCategory**: `'general' | 'tips' | 'questions' | 'showcase' | 'feedback' | 'off_topic'`
- **SocialChallengeType**: `'competitive' | 'collaborative' | 'milestone'`
- **SocialChallengeStatus**: `'draft' | 'active' | 'completed' | 'cancelled'`
- **ShareType**: `'achievement' | 'milestone' | 'chore_completion' | 'streak' | 'badge' | 'general'`
- **ShareVisibility**: `'public' | 'friends_only' | 'household_only'`
- **FriendRequestStatus**: `'pending' | 'accepted' | 'declined' | 'blocked'`
- **CommunityEventType**: `'cleanup' | 'fundraiser' | 'competition' | 'workshop' | 'social' | 'other'`
- **CommunityEventStatus**: `'upcoming' | 'active' | 'completed' | 'cancelled'`

---

## 4. Testing

Tests are located at `apps/web/src/pages/CommunityHub.test.ts` with 43 test cases covering:

- Forum category validation (3 tests)
- Forum post request validation (3 tests)
- Forum reply validation (2 tests)
- Social challenge type validation (2 tests)
- Social challenge status validation and transitions (2 tests)
- Social challenge request validation (2 tests)
- Share type validation (2 tests)
- Share visibility validation (3 tests)
- Social post request validation (2 tests)
- Social comment validation (1 test)
- Friend request status flow and transitions (3 tests)
- Friend request payload validation (3 tests)
- Community event type validation (2 tests)
- Community event status validation and transitions (2 tests)
- Community event request validation (2 tests)
- Data integrity (3 tests)
- Edge cases (6 tests)

---

## 5. Navigation

The Community Hub is accessible from:
- Mobile bottom nav menu (MessageSquare icon, labeled "Community")
- Route: `/households/:householdId/community`
