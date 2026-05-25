# ChoreChamp Requirements Inventory

**Generated:** 2026-03-29
**Source:** docs/FEATURE_BACKLOG.md, docs/ROADMAP.md, docs/INDEX.md

---

## P0 - MVP Core (Phase 1)

### Authentication & Accounts
- REQ-001: Email/password authentication (source: FEATURE_BACKLOG P0)
- REQ-002: Google OAuth sign-in (source: FEATURE_BACKLOG P0)
- REQ-003: Apple Sign-In (source: FEATURE_BACKLOG P0)
- REQ-004: Parent-managed child accounts (no email for kids) (source: FEATURE_BACKLOG P0)
- REQ-005: Household creation with auto-generated invite code (source: FEATURE_BACKLOG P0)
- REQ-006: Join household via invite code (source: FEATURE_BACKLOG P0)
- REQ-007: Role-based access (Parent, Child, Teen, Viewer) (source: FEATURE_BACKLOG P0)

### Chore Management
- REQ-008: Chore CRUD (create, read, update, delete) (source: FEATURE_BACKLOG P0)
- REQ-009: 50+ pre-built chore templates by category (source: FEATURE_BACKLOG P0)
- REQ-010: Recurring scheduling (daily, weekly, monthly, custom) (source: FEATURE_BACKLOG P0)
- REQ-011: "After Last Done" recurrence (source: FEATURE_BACKLOG P0)
- REQ-012: Chore assignment to specific member or "anyone" (source: FEATURE_BACKLOG P0)
- REQ-013: Due date/time window (source: FEATURE_BACKLOG P0)
- REQ-014: Category organization (Kitchen, Bathroom, etc.) (source: FEATURE_BACKLOG P0)
- REQ-015: Age-appropriate suggestions (source: FEATURE_BACKLOG P0)

### Points System
- REQ-016: Points per chore (configurable) (source: FEATURE_BACKLOG P0)
- REQ-017: Point balance display (current + lifetime) (source: FEATURE_BACKLOG P0)
- REQ-018: Point transaction history (source: FEATURE_BACKLOG P0)
- REQ-019: Real-time updates (source: FEATURE_BACKLOG P0)

### Streak System
- REQ-020: Individual streaks per member (source: FEATURE_BACKLOG P0)
- REQ-021: Family streak (source: FEATURE_BACKLOG P0)
- REQ-022: Streak freeze (1 free/week, then points) (source: FEATURE_BACKLOG P0)
- REQ-023: Visual streak display (flame icon) (source: FEATURE_BACKLOG P0)
- REQ-024: Streak milestone celebrations (7, 30, 100 days) (source: FEATURE_BACKLOG P0)

### Badge System (15 Starter)
- REQ-025: 15 starter badges with criteria evaluation (source: FEATURE_BACKLOG P0)
- REQ-026: Badge unlock animations (source: FEATURE_BACKLOG P0)

### Completion Workflow
- REQ-027: Mark chore complete (one-tap) (source: FEATURE_BACKLOG P0)
- REQ-028: Parent approval toggle (per-chore) (source: FEATURE_BACKLOG P0)
- REQ-029: Approval/rejection with feedback (source: FEATURE_BACKLOG P0)
- REQ-030: Completion history (source: FEATURE_BACKLOG P0)
- REQ-031: Celebration animations (confetti) (source: FEATURE_BACKLOG P0)

### Notifications
- REQ-032: Push notifications (source: FEATURE_BACKLOG P0)
- REQ-033: Chore reminders (source: FEATURE_BACKLOG P0)
- REQ-034: Streak-saver alert (source: FEATURE_BACKLOG P0)
- REQ-035: Approval request notifications (source: FEATURE_BACKLOG P0)

### Web Application
- REQ-036: Responsive dashboard (source: FEATURE_BACKLOG P0)
- REQ-037: Chore list view with filters (source: FEATURE_BACKLOG P0)
- REQ-038: Family management UI (source: FEATURE_BACKLOG P0)
- REQ-039: Settings (notification, account) (source: FEATURE_BACKLOG P0)

### Real-Time Sync
- REQ-040: WebSocket updates (source: FEATURE_BACKLOG P0)
- REQ-041: Optimistic UI (source: FEATURE_BACKLOG P0)

---

## P1 - Advanced Gamification (Phase 2)

- REQ-042: Full badge collection (50+) (source: FEATURE_BACKLOG P1)
- REQ-043: Progressive badges (bronze/silver/gold) (source: FEATURE_BACKLOG P1)
- REQ-044: Family party system (source: FEATURE_BACKLOG P1)
- REQ-045: Boss battles (source: FEATURE_BACKLOG P1)
- REQ-046: Leaderboard (weekly family rankings) (source: FEATURE_BACKLOG P1)
- REQ-047: Custom reward catalog (source: FEATURE_BACKLOG P1)
- REQ-048: Reward types (screen time, money, privileges) (source: FEATURE_BACKLOG P1)
- REQ-049: Reward redemption workflow (source: FEATURE_BACKLOG P1)

## P1 - Advanced Task Management (Phase 15)

- REQ-050: Kanban board with drag-and-drop (source: ROADMAP Phase 15)
- REQ-051: Calendar view (source: ROADMAP Phase 15)
- REQ-052: Sortable list view (source: ROADMAP Phase 15)
- REQ-053: Bulk actions (source: ROADMAP Phase 15)
- REQ-054: Advanced filters with saved views (source: ROADMAP Phase 15)
- REQ-055: Command palette (Cmd+K) (source: ROADMAP Phase 15)
- REQ-056: Chore detail panel (comments, attachments, activity) (source: ROADMAP Phase 15)
- REQ-057: Automation rule builder (source: ROADMAP Phase 15)

---

## Claimed Delivered (marked [x] in ROADMAP)

### Phase 12: Monetization
- REQ-058: F12.1 Subscription tier system (Stripe + RevenueCat)
- REQ-059: F12.2 Premium feature gates
- REQ-060: F12.3 In-app purchase store
- REQ-061: F12.4 Enterprise & school edition
- REQ-062: F12.5 API platform & integrations

### Phase 13: Accessibility
- REQ-063: F13.1 Screen reader & assistive technology
- REQ-064: F13.2 Dyslexia & reading accommodations
- REQ-065: F13.3 Cognitive accessibility mode
- REQ-066: F13.4 Multi-language support (i18n)
- REQ-067: F13.5 Special needs accommodations

### Phase 14: Health & Wellness
- REQ-068: F14.1 Activity tracking
- REQ-069: F14.2 Wellness check-ins
- REQ-070: F14.3 Sleep and routine management
- REQ-071: F14.4 Nutrition and meal planning
- REQ-072: F14.5 Mental health support

### Phase 15: Advanced Analytics
- REQ-073: F15.1 Advanced reporting
- REQ-074: F15.2 Admin dashboard
- REQ-075: F15.3 Data export
- REQ-076: F15.4 Audit logging
- REQ-077: F15.5 Performance monitoring

### Phase 16: Community & Social
- REQ-078: F16.1 Community forums
- REQ-079: F16.2 Social challenges
- REQ-080: F16.3 Social sharing and feed
- REQ-081: F16.4 Friend system
- REQ-082: F16.5 Community events

### Phase 17: Smart Automation
- REQ-083: F17.1 Smart scheduling
- REQ-084: F17.2 AI chore suggestions
- REQ-085: F17.3 Automation rules
- REQ-086: F17.4 Predictive analytics
- REQ-087: F17.5 Natural language commands

### Phase 18: Communication & Calendar
- REQ-088: F18.1 Calendar sync
- REQ-089: F18.2 Family chat
- REQ-090: F18.3 Family photo album
- REQ-091: F18.4 Shareable achievements
- REQ-092: F18.5 Progressive unlocks

### Phase 19: Financial & Scheduling
- REQ-093: F19.1 Banking integration
- REQ-094: F19.2 Chore rotation system
- REQ-095: F19.3 Chore chains
- REQ-096: F19.4 Responsibilities vs jobs
- REQ-097: F19.5 Chore marketplace
