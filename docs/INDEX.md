# ChoreChamp Documentation Index

**Project:** ChoreChamp - Gamified Family Chore Management App
**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Overview

ChoreChamp is a cross-platform family chore management application that gamifies household tasks through points, badges, streaks, and leaderboards. This documentation covers all aspects of the project from planning through implementation.

---

## Planning Documents

| Document | Description |
|----------|-------------|
| [ROADMAP.md](./ROADMAP.md) | Phased development plan (16 weeks) |
| [FEATURE_BACKLOG.md](./FEATURE_BACKLOG.md) | Prioritized feature list with research justification |

---

## Software Design Documents (SDDs)

### Core Systems
| Document | Status |
|----------|--------|
| [SDD-001: Authentication System](./sdd/SDD-001-authentication.md) | Draft |
| [SDD-002: Household Management](./sdd/SDD-002-household.md) | Draft |
| [SDD-003: Chore Management](./sdd/SDD-003-chores.md) | Draft |
| [SDD-004: Gamification Engine](./sdd/SDD-004-gamification.md) | Draft |
| [SDD-005: Notification System](./sdd/SDD-005-notifications.md) | Draft |
| [SDD-006: Offline Sync](./sdd/SDD-006-offline-sync.md) | Planned |
| [SDD-007: Rewards System](./sdd/SDD-007-rewards.md) | Planned |

---

## Research Documents

Located in: `/_@agent-prompts/ChoreChamp/research/sessions/`

| Document | Contents |
|----------|----------|
| COMPILED_RESEARCH.md | Complete research compilation (3,800+ lines) |
| Research1.md | Market analysis, competitor overview |
| Research2.md | User reviews, technical patterns |
| Research3.md | Onboarding, accessibility, retention |
| Research4.md | COPPA compliance, teen engagement, pricing |

---

## Development Resources

| Resource | Location |
|----------|----------|
| [Database Guide](./DATABASE.md) | Schema, migrations, seed data |
| Agent Prompt | `/CHORECHAMP_AGENT_PROMPT.md` |
| Work Status | `/roadmap/WORK_STATUS.md` |
| Agent Logs | `/roadmap/AGENT_LOGS/` |

---

## Quick Links

### Key Decisions
- **Architecture:** Fastify + PostgreSQL + better-auth + Redis
- **Pricing:** $9.99/month or $59.99/year
- **Trial:** 7-day free trial
- **COPPA Deadline:** April 22, 2026

### Key Metrics (Targets)
- Day 1 Retention: >40%
- Day 7 Retention: >25%
- Trial Conversion: >40%
- App Store Rating: >4.5

### Primary User Segments
1. "Overwhelmed Organizer Mom" (30-45, 2-4 kids ages 5-14)
2. ADHD/Neurodivergent Families
3. Co-Parenting Families

---

## Document Conventions

- **P0/P1/P2/P3:** Priority levels (P0 = MVP must-have)
- **SDD:** Software Design Document
- **Research Session:** Individual research document from competitor analysis

---

**Maintained by:** Development Team
**Last Review:** 2026-01-28
