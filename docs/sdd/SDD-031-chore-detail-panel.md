# SDD-031: Enhanced Chore Detail Panel

**Status:** Draft
**Priority:** P1
**Author:** ChoreChamp Team
**Last Updated:** 2026-03-14

---

## 1. Overview

### 1.1 Purpose
Implement a full-featured slide-out panel for viewing and editing chore details, replacing the existing ChoreDetailModal with richer functionality including threaded comments, file attachments, and a chronological activity log.

### 1.2 Scope
- Slide-out panel with collapsible sections
- Inline editing for chore title and all metadata fields
- Threaded comments with @mention support for household members
- File attachments and photo proof integration
- Chronological activity log tracking all chore changes
- Real-time updates via Socket.io

### 1.3 Research Justification
- **Slide-out panels over modals:** Trello, Linear, and Notion all use slide-out detail panels because they let users reference the board/list behind them while editing. Modal overlays block context.
- **Activity logs:** Families with multiple members need visibility into who changed what and when, reducing "I didn't know" conflicts.
- **@mentions in comments:** Keeps communication contextual. Parents can tag kids on specific chores instead of sending separate messages.

---

## 2. Database Schema

### 2.1 Chore Comments Table

```typescript
// packages/database/src/schema/chore-comments.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { chores } from './chores';
import { members } from './members';

export const choreComments = pgTable('chore_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  choreId: uuid('chore_id').notNull().references(() => chores.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  comment: text('comment').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

```sql
CREATE INDEX idx_chore_comments_chore ON chore_comments(chore_id);
CREATE INDEX idx_chore_comments_member ON chore_comments(member_id);
CREATE INDEX idx_chore_comments_active ON chore_comments(chore_id) WHERE deleted_at IS NULL;
```

### 2.2 Chore Attachments Table

```typescript
// packages/database/src/schema/chore-attachments.ts
import { pgTable, uuid, varchar, text, bigint, boolean, timestamp } from 'drizzle-orm/pg-core';
import { chores } from './chores';
import { members } from './members';

export const choreAttachments = pgTable('chore_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  choreId: uuid('chore_id').notNull().references(() => chores.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  isPhotoProof: boolean('is_photo_proof').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

```sql
CREATE INDEX idx_chore_attachments_chore ON chore_attachments(chore_id);
CREATE INDEX idx_chore_attachments_proof ON chore_attachments(chore_id) WHERE is_photo_proof = TRUE;
```

### 2.3 Chore Activity Log Table

```typescript
// packages/database/src/schema/chore-activity-log.ts
import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { chores } from './chores';
import { members } from './members';

export const choreActivityLog = pgTable('chore_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  choreId: uuid('chore_id').notNull().references(() => chores.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 50 }).notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

```sql
CREATE INDEX idx_chore_activity_chore ON chore_activity_log(chore_id);
CREATE INDEX idx_chore_activity_created ON chore_activity_log(chore_id, created_at DESC);
```

### 2.4 Activity Action Types

| Action | Description | old_value / new_value |
|--------|-------------|----------------------|
| `status_changed` | Chore status updated | `{ status: 'todo' }` / `{ status: 'done' }` |
| `assignee_changed` | Assignee updated | `{ assigneeId: '...' }` / `{ assigneeId: '...' }` |
| `priority_changed` | Priority updated | `{ priority: 'medium' }` / `{ priority: 'high' }` |
| `category_changed` | Category updated | `{ category: 'kitchen' }` / `{ category: 'bathroom' }` |
| `title_changed` | Title edited inline | `{ title: 'old' }` / `{ title: 'new' }` |
| `description_changed` | Description updated | `{ description: '...' }` / `{ description: '...' }` |
| `due_date_changed` | Due date moved | `{ dueDate: '...' }` / `{ dueDate: '...' }` |
| `comment_added` | New comment posted | null / `{ commentId: '...' }` |
| `attachment_added` | File attached | null / `{ attachmentId: '...', fileName: '...' }` |
| `attachment_removed` | File removed | `{ attachmentId: '...', fileName: '...' }` / null |
| `chore_completed` | Marked complete | null / `{ completionId: '...' }` |
| `chore_archived` | Chore archived | `{ isActive: true }` / `{ isActive: false }` |

---

## 3. API Endpoints

### 3.1 Comment Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/households/:id/chores/:choreId/comments` | List comments | Member |
| POST | `/api/households/:id/chores/:choreId/comments` | Create comment | Member |
| PATCH | `/api/households/:id/chores/:choreId/comments/:commentId` | Edit comment | Author |
| DELETE | `/api/households/:id/chores/:choreId/comments/:commentId` | Soft-delete comment | Author/Parent |

### 3.2 Attachment Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/households/:id/chores/:choreId/attachments` | List attachments | Member |
| POST | `/api/households/:id/chores/:choreId/attachments` | Upload attachment | Member |
| DELETE | `/api/households/:id/chores/:choreId/attachments/:attachmentId` | Remove attachment | Author/Parent |

### 3.3 Activity Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/households/:id/chores/:choreId/activity` | Get activity log | Member |

### 3.4 Request/Response Examples

#### POST `/api/households/:id/chores/:choreId/comments`

```typescript
// Request
{
  comment: "Hey @[Emma](member-uuid-123), can you do this one before dinner?"
}

// Response
{
  id: "comment-uuid",
  choreId: "chore-uuid",
  memberId: "author-uuid",
  comment: "Hey @[Emma](member-uuid-123), can you do this one before dinner?",
  createdAt: "2026-03-14T18:00:00Z",
  updatedAt: "2026-03-14T18:00:00Z",
  member: {
    id: "author-uuid",
    displayName: "Dad",
    avatarUrl: "..."
  }
}
```

#### GET `/api/households/:id/chores/:choreId/activity?limit=20&cursor=...`

```typescript
// Response (cursor-paginated)
{
  items: [
    {
      id: "activity-uuid",
      choreId: "chore-uuid",
      memberId: "member-uuid",
      action: "status_changed",
      oldValue: { status: "todo" },
      newValue: { status: "in_progress" },
      createdAt: "2026-03-14T17:30:00Z",
      member: { displayName: "Emma", avatarUrl: "..." }
    }
  ],
  nextCursor: "activity-uuid-next"
}
```

---

## 4. Implementation

### 4.1 Panel Layout and Behavior

The ChoreDetailPanel slides in from the right side of the viewport. On desktop it occupies 480px width with the main content area still visible and slightly dimmed behind a transparent overlay. On mobile (viewport < 768px) it takes full screen width.

Opening and closing is animated with a 200ms ease-out transition. Pressing Escape or clicking the overlay closes the panel. The URL updates to include `?chore=choreId` so the panel state is shareable and survives page refreshes.

### 4.2 Panel Sections

All sections below the header are collapsible. Collapse state persists in localStorage per member so each family member keeps their preferred layout.

1. **Header** - Chore title (click to edit inline), close button (X), action menu dropdown (delete, duplicate, archive)
2. **Description** - Plain text or rich text editor, expandable textarea, auto-saves on blur
3. **Steps / Subtasks** - Integrates with the existing TaskBreakdown component for ADHD task chunking; checkable steps with progress bar
4. **Metadata Fields** - Assignee picker, status dropdown, category selector, priority selector, difficulty selector, points display, due date picker, due time picker, estimated minutes input, requires approval toggle, requires photo toggle
5. **Comments** - Threaded comment list with @mention support, newest first, with reply button per comment
6. **Attachments** - Grid of thumbnails for images, list rows for other files, drag-and-drop upload zone, photo proof badge indicator
7. **Activity Log** - Chronological timeline of all changes, cursor-paginated, loads more on scroll

### 4.3 Components

```
apps/web/src/components/chores/
  ChoreDetailPanel.tsx        -- Root panel container, manages open/close and section layout
  ChoreDetailHeader.tsx       -- Title, close, action menu
  ChoreDescriptionEditor.tsx  -- Editable description with auto-save
  ChoreMetadataFields.tsx     -- All metadata fields in a compact grid
  CommentsSection.tsx          -- Comment list + new comment input
  MentionInput.tsx             -- Text input with @mention dropdown trigger
  AttachmentsSection.tsx       -- Attachment grid/list + upload zone
  ActivityTimeline.tsx         -- Chronological activity feed
```

### 4.4 @Mention System

The MentionInput component listens for the `@` character typed into the comment input. When detected, it opens a dropdown populated with household members fetched from the existing members query cache. Arrow keys navigate the list, Enter or click selects a member.

Selected mentions are inserted as `@[memberName](memberId)` in the raw comment text. On render, the CommentsSection parses this syntax and displays mentions as styled chips linking to the member profile.

```typescript
// Mention parsing regex
const MENTION_REGEX = /@\[([^\]]+)\]\(([^)]+)\)/g;

function parseMentions(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'mention', name: match[1], memberId: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}
```

### 4.5 Activity Log Recording

Every mutation to a chore (status change, field edit, comment, attachment) inserts a row into `chore_activity_log`. This is handled by a `recordActivity` helper called within each service method:

```typescript
async function recordActivity(
  choreId: string,
  memberId: string,
  action: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>,
) {
  await db.insert(choreActivityLog).values({
    choreId,
    memberId,
    action,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  });
}
```

### 4.6 Attachment Upload Flow

Attachments use the same pre-signed URL approach as photo proof (see SDD-003, Section 10). The client requests a signed upload URL, uploads directly to S3/R2, then POSTs the metadata to the attachments endpoint. Maximum file size is 10 MB. Accepted MIME types: `image/*`, `application/pdf`, `text/plain`.

Thumbnails for images are generated client-side using canvas resize before displaying in the attachments grid.

---

## 5. Real-Time Events

| Event | Payload | Description |
|-------|---------|-------------|
| `comment:added` | `{ choreId, comment }` | New comment posted on a chore |
| `comment:updated` | `{ choreId, commentId, comment }` | Comment edited |
| `comment:deleted` | `{ choreId, commentId }` | Comment soft-deleted |
| `attachment:added` | `{ choreId, attachment }` | New file attached |
| `attachment:removed` | `{ choreId, attachmentId }` | File removed |
| `activity:recorded` | `{ choreId, activity }` | New activity log entry |

All events are scoped to the household room in Socket.io so only household members receive them.

---

## 6. Error Handling

| Error Code | Message | HTTP Status |
|------------|---------|-------------|
| `CHORE_NOT_FOUND` | Chore not found | 404 |
| `COMMENT_NOT_FOUND` | Comment not found | 404 |
| `COMMENT_NOT_AUTHOR` | Only the comment author can edit or delete | 403 |
| `ATTACHMENT_NOT_FOUND` | Attachment not found | 404 |
| `ATTACHMENT_TOO_LARGE` | File exceeds 10 MB limit | 413 |
| `ATTACHMENT_TYPE_NOT_ALLOWED` | File type not supported | 415 |
| `UPLOAD_FAILED` | Failed to generate upload URL | 500 |

---

## 7. Testing Strategy

### 7.1 Unit Tests
- `parseMentions`: verify correct parsing of @mention syntax, edge cases (no mentions, multiple mentions, nested brackets)
- `recordActivity`: verify correct insertion with all action types
- Points calculation unchanged (covered by SDD-003 tests)

### 7.2 Integration Tests
- Comment CRUD: create, list, edit, soft-delete, verify soft-deleted comments excluded from GET
- Attachment CRUD: create with metadata, list, delete, verify cascade on chore deletion
- Activity log: verify log entries created on status change, assignee change, comment add, attachment add
- Authorization: verify only comment author can edit/delete, parents can delete any comment

### 7.3 Component Tests
- ChoreDetailPanel: opens/closes with animation, renders all sections, URL sync works
- MentionInput: typing "@" opens dropdown, selecting member inserts mention syntax, keyboard navigation works
- CommentsSection: renders mentions as styled chips, delete button appears for author only
- AttachmentsSection: drag-and-drop triggers upload, thumbnails render for images, file list for non-images
- ActivityTimeline: renders entries in chronological order, loads more on scroll

### 7.4 E2E Tests
- Open chore detail panel from Kanban board, edit title inline, verify change persists
- Post a comment with @mention, verify mentioned member sees notification
- Upload an attachment, verify it appears in the attachments section
- Verify activity log records all changes made during the session

---

**Document Version:** 1.0.0
**Next Review:** After implementation sprint
