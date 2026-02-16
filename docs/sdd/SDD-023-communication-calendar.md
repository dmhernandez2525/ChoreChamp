# SDD-023: Communication & Calendar Integration (Phase 18)

**Status:** Implemented
**Date:** 2026-02-15
**Phase:** 18
**Features:** F18.1-F18.5

---

## 1. Overview

Phase 18 introduces communication and calendar integration features to ChoreChamp, enabling families to sync chore schedules with external calendars, communicate through in-app messaging, share photos of completed chores, create shareable achievement cards for social platforms, and progressively unlock features based on engagement. This phase consists of five integrated features:

- **F18.1 Calendar Sync**: Bidirectional synchronization with Google, Apple, Outlook, and iCal calendars, including configurable sync direction, event mapping to chores, and per-household display preferences.
- **F18.2 Family Chat/Messaging**: Real-time household channels, direct messages between members, and chore-specific discussion threads with support for text, images, chore shares, and achievement messages.
- **F18.3 Family Photo Album**: Organized photo albums for chore completions, achievements, milestones, and general family photos, with likes, comments, and automatic album generation.
- **F18.4 Shareable Achievements**: Social sharing cards in multiple visual styles (minimal, colorful, animated, classic) that can be shared across Facebook, Twitter, Instagram, WhatsApp, email, and direct link, with view/share analytics and parental controls.
- **F18.5 Progressive Unlocks**: Feature unlocking system driven by engagement triggers (days active, chores completed, streaks reached, badges earned, level reached) across five categories: feature, cosmetic, gamification, social, and advanced.

These features are unified through a FamilyHub page with a 5-tab interface, shared API endpoints under the `family-hub` prefix, and coordinated database schema.

---

## 2. Architecture

### 2.1 Database Schema

All communication and calendar data is stored in `packages/database/src/schema/communication-calendar.ts` with 12 tables spanning the five features.

#### calendarConnections
Stores OAuth-connected external calendar accounts per household member, including provider type, sync direction, connection status, and encrypted access/refresh tokens.

#### calendarEvents
Maps ChoreChamp chores to external calendar events with bidirectional ID tracking, time ranges, all-day flags, and recurrence rules.

#### calendarSyncConfigs
Per-household configuration controlling what information is pushed to external calendars: chore details, assignee names, point values, reminder offsets, and color coding.

#### chatChannels
Defines messaging channels scoped to a household, supporting three types: household-wide channels, direct messages between two members, and chore-specific discussion threads.

#### chatMessages
Individual messages within channels, supporting five message types (text, image, chore_share, achievement, system) with edit tracking and per-member read receipts stored as JSON arrays.

#### photoAlbums
Album containers with five types (chore_completions, achievements, milestones, general, auto_generated), cover photos, and aggregate photo counts.

#### albumPhotos
Individual photos within albums, linked to uploaders and optionally to specific chores, with caption text, timestamps, and engagement counters for likes and comments.

#### shareableAchievements
Generated share cards for member accomplishments, including visual style selection, unique share URLs, and view/share count analytics with optional expiration dates.

#### shareRecords
Tracks each individual share action for an achievement card, recording the target platform and timestamp for analytics.

#### shareSettings
Per-household configuration for the sharing feature: global enable/disable, default card style, household name and avatar inclusion toggles, auto-share rules for badges and streak milestones, and parental approval requirements.

#### progressiveUnlocks
Defines the catalog of unlockable features/content, each with a category, trigger type, threshold value, icon, and display order.

#### memberUnlockProgress
Tracks each member's progress toward each unlock, recording current progress value, unlock status, and notification timestamps.

### 2.2 API Routes

All endpoints are registered under `/:householdId/family-hub` in `apps/api/src/routes/communication-calendar.ts`.

#### Calendar Sync Endpoints (F18.1)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/calendar/connections` | List calendar connections for the household |
| POST | `/calendar/connections` | Create a new calendar connection with OAuth tokens |
| DELETE | `/calendar/connections/:connectionId` | Remove a calendar connection |
| POST | `/calendar/connections/:connectionId/sync` | Trigger manual sync for a connection |
| GET | `/calendar/events` | List synced calendar events |
| GET | `/calendar/config` | Get calendar sync configuration |
| PUT | `/calendar/config` | Update calendar sync configuration |

#### Family Chat Endpoints (F18.2)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat/channels` | List chat channels |
| POST | `/chat/channels` | Create a new chat channel |
| GET | `/chat/channels/:channelId/messages` | Get messages for a channel (paginated) |
| POST | `/chat/channels/:channelId/messages` | Send a message to a channel |
| PUT | `/chat/channels/:channelId/messages/:messageId` | Edit a message |
| DELETE | `/chat/channels/:channelId/messages/:messageId` | Delete a message |
| POST | `/chat/channels/:channelId/read` | Mark a channel as read |
| GET | `/chat/unread` | Get unread message counts per channel |

#### Photo Album Endpoints (F18.3)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/albums` | List photo albums |
| POST | `/albums` | Create a new photo album |
| GET | `/albums/:albumId` | Get album details with photos |
| POST | `/albums/:albumId/photos` | Upload a photo to an album |
| POST | `/albums/:albumId/photos/:photoId/like` | Like or unlike a photo |
| DELETE | `/albums/:albumId/photos/:photoId` | Delete a photo |
| DELETE | `/albums/:albumId` | Delete an album |

#### Shareable Achievements Endpoints (F18.4)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/achievements/shareable` | List shareable achievement cards |
| POST | `/achievements/shareable` | Create a shareable achievement card |
| POST | `/achievements/shareable/:achievementId/share` | Record a share action to a platform |
| GET | `/achievements/share-settings` | Get household share settings |
| PUT | `/achievements/share-settings` | Update household share settings |

#### Progressive Unlocks Endpoints (F18.5)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/unlocks` | List all progressive unlocks (filterable by category) |
| GET | `/unlocks/progress` | Get current member's unlock progress |
| GET | `/unlocks/progress/:memberId` | Get a specific member's unlock progress |
| POST | `/unlocks/:unlockId/notify` | Mark an unlock notification as seen |

### 2.3 Frontend Components

The `FamilyHub` page (`apps/web/src/pages/FamilyHub.tsx`) provides a 5-tab interface:

1. **Calendar** - Provider grid (Google, Apple, Outlook, iCal), connection management, sync status display
2. **Chat** - Channel type filters (Household, Direct, Chore Discussion), message list, compose input with send button
3. **Photos** - Album type filters (All, Chore Completions, Achievements, Milestones, General), album grid, photo upload
4. **Share** - Achievement stats dashboard (Shared, Views, Cards, Platforms), card style filters (Minimal, Colorful, Animated, Classic), achievement card list
5. **Unlocks** - Progress stats (Total, Unlocked, Progress %), search input, category filters (Feature, Cosmetic, Gamification, Social, Advanced), unlock cards

### 2.4 API Client Integration

The `ApiClient` class (`packages/api-client/src/client.ts`) includes ~25 methods for family hub features, with corresponding React Query hooks in `packages/api-client/src/hooks/index.ts`:

**Calendar hooks:** `useCalendarConnections`, `useCreateCalendarConnection`, `useDeleteCalendarConnection`, `useSyncCalendarConnection`, `useCalendarEvents`, `useCalendarSyncConfig`, `useUpdateCalendarSyncConfig`

**Chat hooks:** `useChatChannels`, `useCreateChatChannel`, `useChatMessages`, `useSendChatMessage`, `useChatUnreadCounts`

**Photo hooks:** `usePhotoAlbums`, `useCreatePhotoAlbum`, `useAlbumPhotos`, `useUploadPhoto`, `useDeletePhoto`

**Sharing hooks:** `useShareableAchievements`, `useCreateShareableAchievement`, `useShareAchievement`, `useShareSettings`, `useUpdateShareSettings`

**Unlock hooks:** `useProgressiveUnlocks`, `useMemberUnlockProgress`, `useUnlockProgressSummary`, `useCheckUnlocks`

---

## 3. Feature Details

### 3.1 F18.1 Calendar Sync

Calendar Sync enables bidirectional synchronization between ChoreChamp chore schedules and external calendar providers.

**Supported Providers:**
- Google Calendar (OAuth 2.0)
- Apple Calendar (CalDAV)
- Microsoft Outlook (Microsoft Graph API)
- iCal (standard iCalendar feed URL)

**Sync Directions:**
- `push`: ChoreChamp events are written to the external calendar
- `pull`: External calendar events are read into ChoreChamp
- `bidirectional`: Full two-way synchronization

**Sync Configuration** allows households to control:
- Whether chore details (description, instructions) are included in calendar events
- Whether the assignee name appears in the event title
- Whether point values are shown
- Custom reminder offset in minutes (0 to 1440)
- Custom color code for ChoreChamp events in the external calendar

**Connection Lifecycle:**
1. Member initiates connection by selecting a provider
2. OAuth flow completes, returning access and refresh tokens
3. Connection is stored with `active` status
4. Sync can be triggered manually or runs on a scheduled interval
5. Errors are accumulated in the `syncErrors` array; persistent failures move status to `error`
6. Members can disconnect at any time, which removes the connection and its synced events

### 3.2 F18.2 Family Chat/Messaging

Family Chat provides in-app messaging scoped to households, enabling real-time communication about chores and family activities.

**Channel Types:**
- `household`: Visible to all household members, used for general announcements and coordination
- `direct`: Private conversation between two specific members
- `chore_discussion`: Linked to a specific chore via `choreId`, used for task-specific communication

**Message Types:**
- `text`: Standard text message (max 2000 characters)
- `image`: Message with an attached image URL
- `chore_share`: Embedded reference to a chore (uses `referenceId`)
- `achievement`: Embedded reference to an achievement
- `system`: Auto-generated messages (e.g., "Member joined the channel")

**Read Tracking:**
- Each message stores a `readBy` array of member IDs
- The `POST /chat/channels/:channelId/read` endpoint marks all messages in a channel as read for the current user
- Unread counts are available per channel via `GET /chat/unread`

**Message Operations:**
- Messages can be edited (sets `isEdited` to true) and deleted
- Edit history is tracked through the `updatedAt` timestamp

### 3.3 F18.3 Family Photo Album

Family Photo Album lets households organize and share photos of chore completions, achievements, and family milestones.

**Album Types:**
- `chore_completions`: Photos documenting completed chores
- `achievements`: Screenshots and photos of earned badges and rewards
- `milestones`: Special family accomplishments
- `general`: Miscellaneous family photos
- `auto_generated`: System-created albums (e.g., weekly highlights)

**Photo Features:**
- Each photo stores both a full-size `url` and a `thumbnailUrl` for efficient gallery rendering
- Photos can optionally be linked to a specific chore via `choreId`
- The `takenAt` field allows backdating photos that were taken before upload
- Like and comment counts are tracked per photo
- Albums maintain an aggregate `photoCount` and optional `coverPhotoUrl`

### 3.4 F18.4 Shareable Achievements

Shareable Achievements generates visual cards for member accomplishments that can be shared on social media and messaging platforms.

**Card Styles:**
- `minimal`: Clean, text-focused design
- `colorful`: Vibrant colors with gradients
- `animated`: Includes motion effects (for supported platforms)
- `classic`: Traditional badge/certificate style

**Supported Platforms:**
- Facebook, Twitter, Instagram, WhatsApp, Email, Direct Link

**Share Analytics:**
- Each shareable achievement tracks `viewCount` and `shareCount`
- Individual share actions are recorded in `shareRecords` with platform and timestamp
- Achievements can have optional expiration dates via `expiresAt`

**Household Settings:**
- `enableSharing`: Global toggle for the sharing feature
- `defaultCardStyle`: Default visual style for new cards
- `includeHouseholdName` / `includeMemberAvatar`: Privacy controls for card content
- `autoShareBadges` / `autoShareStreakMilestones`: Automatic card generation for key events
- `parentApprovalRequired`: When enabled, child members need parent approval before sharing externally

### 3.5 F18.5 Progressive Unlocks

Progressive Unlocks gates features and content behind engagement milestones, encouraging sustained participation.

**Unlock Categories:**
- `feature`: Core functionality (e.g., advanced scheduling, custom themes)
- `cosmetic`: Visual customizations (e.g., avatar frames, card backgrounds)
- `gamification`: Game mechanics (e.g., bonus challenges, special rewards)
- `social`: Social features (e.g., expanded sharing options, community access)
- `advanced`: Power-user capabilities (e.g., automation rules, analytics dashboards)

**Trigger Types:**
- `days_active`: Consecutive or total days of app usage
- `chores_completed`: Total number of chores marked complete
- `streak_reached`: Highest streak milestone achieved
- `badges_earned`: Total badges collected
- `level_reached`: Member level threshold

**Progress Tracking:**
- Each member's progress toward each unlock is tracked in `memberUnlockProgress`
- The `currentProgress` field increments as the member performs qualifying actions
- When `currentProgress >= threshold`, the unlock is granted and `isUnlocked` is set to true
- A notification is queued; once the member views it, `notifiedAt` is set
- The `UnlockProgressSummary` aggregates overall progress, next upcoming unlock, and recently unlocked items

---

## 4. Database Schema

### F18.1 Calendar Sync Tables

#### calendarConnections
```typescript
{
  id: uuid (primary key)
  householdId: string (indexed)
  memberId: string (indexed)
  provider: CalendarProvider  // 'google' | 'apple' | 'outlook' | 'ical'
  calendarId: string
  calendarName: string
  syncDirection: CalendarSyncDirection  // 'push' | 'pull' | 'bidirectional'
  status: CalendarSyncStatus  // 'active' | 'paused' | 'error' | 'disconnected'
  accessToken: string (encrypted)
  refreshToken: string | null (encrypted)
  lastSyncAt: timestamp | null
  syncErrors: JSON (string[])
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### calendarEvents
```typescript
{
  id: uuid (primary key)
  connectionId: string (indexed)
  choreId: string (indexed)
  externalEventId: string
  title: string
  description: string | null
  startTime: timestamp
  endTime: timestamp
  isAllDay: boolean
  recurrence: string | null  // iCalendar RRULE format
  lastSyncAt: timestamp
}
```

#### calendarSyncConfigs
```typescript
{
  id: uuid (primary key)
  householdId: string (indexed)
  includeChoreDetails: boolean (default true)
  includeAssignee: boolean (default true)
  includePoints: boolean (default false)
  reminderMinutes: integer (default 30)
  colorCode: string | null
  createdAt: timestamp
  updatedAt: timestamp
}
```

### F18.2 Chat Tables

#### chatChannels
```typescript
{
  id: uuid (primary key)
  householdId: string (indexed)
  name: string
  type: ChatChannelType  // 'household' | 'direct' | 'chore_discussion'
  participantIds: JSON (string[])
  choreId: string | null
  lastMessageAt: timestamp | null
  createdAt: timestamp
  updatedAt: timestamp
}
```
Indexes: `household_idx`, `type_idx`

#### chatMessages
```typescript
{
  id: uuid (primary key)
  channelId: string (indexed)
  senderId: string (indexed)
  senderName: string
  type: MessageType  // 'text' | 'image' | 'chore_share' | 'achievement' | 'system'
  content: string
  imageUrl: string | null
  referenceId: string | null
  isEdited: boolean (default false)
  readBy: JSON (string[])
  createdAt: timestamp (indexed)
  updatedAt: timestamp
}
```
Indexes: `channel_idx`, `sender_idx`, `created_idx`

### F18.3 Photo Tables

#### photoAlbums
```typescript
{
  id: uuid (primary key)
  householdId: string (indexed)
  name: string
  description: string | null
  coverPhotoUrl: string | null
  type: AlbumType  // 'chore_completions' | 'achievements' | 'milestones' | 'general' | 'auto_generated'
  photoCount: integer (default 0)
  createdById: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### albumPhotos
```typescript
{
  id: uuid (primary key)
  albumId: string (indexed)
  householdId: string (indexed)
  uploadedById: string
  uploaderName: string
  url: string
  thumbnailUrl: string
  caption: string | null
  choreId: string | null
  takenAt: timestamp | null
  likeCount: integer (default 0)
  commentCount: integer (default 0)
  createdAt: timestamp
}
```

### F18.4 Sharing Tables

#### shareableAchievements
```typescript
{
  id: uuid (primary key)
  householdId: string (indexed)
  memberId: string (indexed)
  memberName: string
  achievementType: string
  title: string
  description: string
  imageUrl: string | null
  cardStyle: AchievementCardStyle  // 'minimal' | 'colorful' | 'animated' | 'classic'
  shareUrl: string
  viewCount: integer (default 0)
  shareCount: integer (default 0)
  createdAt: timestamp
  expiresAt: timestamp | null
}
```

#### shareRecords
```typescript
{
  id: uuid (primary key)
  achievementId: string (indexed)
  platform: SharePlatform  // 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'link' | 'email'
  sharedAt: timestamp
}
```

#### shareSettings
```typescript
{
  id: uuid (primary key)
  householdId: string (indexed)
  enableSharing: boolean (default true)
  defaultCardStyle: AchievementCardStyle (default 'colorful')
  includeHouseholdName: boolean (default false)
  includeMemberAvatar: boolean (default true)
  autoShareBadges: boolean (default false)
  autoShareStreakMilestones: boolean (default false)
  parentApprovalRequired: boolean (default true)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### F18.5 Unlock Tables

#### progressiveUnlocks
```typescript
{
  id: uuid (primary key)
  name: string
  description: string
  category: UnlockCategory  // 'feature' | 'cosmetic' | 'gamification' | 'social' | 'advanced'
  trigger: UnlockTrigger  // 'days_active' | 'chores_completed' | 'streak_reached' | 'badges_earned' | 'level_reached'
  threshold: integer
  iconUrl: string | null
  sortOrder: integer (default 0)
}
```
Index: `category_idx`

#### memberUnlockProgress
```typescript
{
  id: uuid (primary key)
  memberId: string (indexed)
  householdId: string (indexed)
  unlockId: string (indexed)
  currentProgress: integer (default 0)
  isUnlocked: boolean (default false)
  unlockedAt: timestamp | null
  notifiedAt: timestamp | null
}
```

### ORM Relations

- `chatChannels` has many `chatMessages` (one-to-many via `channelId`)
- `photoAlbums` has many `albumPhotos` (one-to-many via `albumId`)
- `shareableAchievements` has many `shareRecords` (one-to-many via `achievementId`)

---

## 5. Type Definitions

All types are defined in `packages/types/src/communication-calendar.ts`:

- **CalendarProvider**: `'google' | 'apple' | 'outlook' | 'ical'`
- **CalendarSyncDirection**: `'push' | 'pull' | 'bidirectional'`
- **CalendarSyncStatus**: `'active' | 'paused' | 'error' | 'disconnected'`
- **MessageType**: `'text' | 'image' | 'chore_share' | 'achievement' | 'system'`
- **ChatChannelType**: `'household' | 'direct' | 'chore_discussion'`
- **AlbumType**: `'chore_completions' | 'achievements' | 'milestones' | 'general' | 'auto_generated'`
- **SharePlatform**: `'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'link' | 'email'`
- **AchievementCardStyle**: `'minimal' | 'colorful' | 'animated' | 'classic'`
- **UnlockCategory**: `'feature' | 'cosmetic' | 'gamification' | 'social' | 'advanced'`
- **UnlockTrigger**: `'days_active' | 'chores_completed' | 'streak_reached' | 'badges_earned' | 'level_reached'`

Request/response interfaces include: `CreateCalendarConnectionRequest`, `UpdateCalendarSyncConfigRequest`, `CreateChatChannelRequest`, `CreateChatMessageRequest`, `ChatUnreadCount`, `CreatePhotoAlbumRequest`, `UploadPhotoRequest`, `CreateShareableAchievementRequest`, `UpdateShareSettingsRequest`, and `UnlockProgressSummary`.

---

## 6. Security Considerations

### Authentication & Authorization
- All endpoints require household membership; requests are scoped to the authenticated user's household.
- Direct message channels enforce that only the two participants can read/write messages.
- Chore discussion channels are accessible to all household members assigned to or involved with the chore.

### OAuth Token Security
- Calendar connection access tokens and refresh tokens are stored encrypted at rest.
- Refresh tokens are used to obtain new access tokens transparently; expired tokens trigger re-authentication flows.
- Token revocation occurs automatically when a calendar connection is deleted.

### Parental Controls
- The `parentApprovalRequired` flag in share settings requires parent/admin approval before child members can share achievements externally.
- Photo uploads and album creation respect household role permissions.

### Data Privacy
- Shareable achievement cards use unique, non-guessable URLs.
- Achievement cards can be set to expire via `expiresAt`, after which the share URL returns a 404.
- Photo URLs should point to a CDN with signed URLs that expire, preventing unauthorized long-term access.

### Message Content
- Chat message content is validated with a 2000-character maximum.
- Image URLs are validated before storage.
- System messages cannot be sent by regular users (server-generated only).

### Rate Limiting
- Calendar sync operations are rate-limited to prevent excessive API calls to external providers.
- Message sending is rate-limited per member to prevent spam.

---

## 7. Future Enhancements

- **Real-time messaging** via WebSocket connections for instant message delivery and typing indicators.
- **Photo moderation** with AI-powered content scanning before photos are visible to the household.
- **Calendar conflict detection** that warns when chore schedules overlap with existing external calendar events.
- **Rich message formatting** with Markdown support, @mentions, and emoji reactions.
- **Photo comments** as a dedicated feature (currently tracked via `commentCount` but not yet implemented as an endpoint).
- **Achievement card templates** with seasonal and event-themed designs.
- **Unlock dependencies** allowing certain unlocks to require other unlocks as prerequisites, creating progression trees.
- **Push notifications** for new chat messages, photo uploads, and unlock completions.
- **Calendar analytics** showing chore schedule density, busiest days, and scheduling pattern insights.
- **Shared family calendar view** aggregating all members' synced calendars into a unified household timeline.

---

## 8. Navigation

The Family Hub is accessible from:
- Mobile bottom nav menu (Users icon, labeled "Family Hub")
- Route: `/households/:householdId/family-hub`
