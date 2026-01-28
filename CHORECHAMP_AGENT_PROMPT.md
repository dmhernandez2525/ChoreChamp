# ChoreChamp Agent Prompt

**Version:** 1.0.0
**Last Updated:** 2026-01-28
**Project:** ChoreChamp - Gamified Family Chore Management App

---

## Quick Reference

### Project Location
```
/Users/daniel/Desktop/Projects/PersonalProjects/ChoreChamp/
```

### Key Commands
```bash
# Development
pnpm dev              # Start all services
pnpm dev:web          # Web app only
pnpm dev:api          # API only
pnpm dev:mobile       # Mobile app

# Testing
pnpm test             # Run all tests
pnpm test:api         # API tests only
pnpm lint             # Lint all packages

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed sample data
pnpm db:studio        # Open Drizzle Studio

# Building
pnpm build            # Build all packages
pnpm build:api        # Build API only
```

### Critical Files
- `docs/ROADMAP.md` - Development phases
- `docs/FEATURE_BACKLOG.md` - Prioritized features
- `docs/sdd/*.md` - Technical specifications
- `roadmap/WORK_STATUS.md` - Current progress

---

## Project Context

### What is ChoreChamp?
ChoreChamp is a cross-platform family chore management app that gamifies household tasks through points, badges, streaks, and family party mechanics. It targets the $542M parenting app market.

### Primary Differentiators
1. **Deep gamification** - Family party system, boss battles, visual progress (competitors lack this)
2. **Bulletproof offline-first** - WatermelonDB + sync engine (competitors' #1 complaint is reliability)
3. **Neurodivergent-friendly** - Visual timers, task chunking, FDA-validated approaches
4. **Cross-platform** - Web, iOS, Android, macOS, Windows

### Target Users
1. **Primary:** "Overwhelmed Organizer Mom" (30-45, 2-4 kids ages 5-14)
2. **Secondary:** ADHD/Neurodivergent families
3. **Tertiary:** Co-parenting families

---

## Architecture Overview

### Technology Stack

**Frontend - Web**
- React 19 + Vite 7
- TypeScript 5.9
- Tailwind CSS 4 + shadcn/ui
- Zustand 5 (state)
- TanStack Query 5 (data fetching)
- Socket.io Client (real-time)

**Frontend - Mobile**
- Expo SDK 52 + React Native 0.76
- Expo Router 4
- NativeWind 4
- WatermelonDB (offline-first)

**Desktop**
- macOS: Swift/AppKit (native)
- Windows: Tauri 2.0 + React

**Backend**
- Fastify 5
- better-auth (authentication)
- Drizzle ORM + PostgreSQL 17
- Redis 8 (cache, sessions)
- BullMQ (job queues)
- Socket.io (real-time)

**Infrastructure**
- Render (hosting)
- Cloudflare R2 (images)

### Project Structure
```
chorechamp/
├── apps/
│   ├── web/           # React 19 + Vite
│   ├── mobile/        # Expo React Native
│   ├── api/           # Fastify backend
│   ├── marketing/     # Next.js 16 landing page
│   ├── desktop-mac/   # Swift/AppKit
│   └── desktop-windows/  # Tauri + React
├── packages/
│   ├── database/      # Drizzle ORM schema
│   ├── api-client/    # Type-safe API client
│   ├── gamification/  # Points, badges, streaks
│   ├── types/         # Shared TypeScript types
│   └── ui/            # Shared components
├── docs/
│   ├── sdd/           # Software Design Documents
│   ├── ROADMAP.md
│   └── FEATURE_BACKLOG.md
└── roadmap/
    ├── WORK_STATUS.md
    └── AGENT_LOGS/
```

---

## Development Guidelines

### Code Standards

**NEVER use:**
```typescript
any                    // Use specific types
@ts-ignore            // Fix the type error
console.log           // Use logger
```

**ALWAYS use:**
```typescript
// Logging
import { logger } from '@chorechamp/api/logger';
logger.info('chore.complete', { choreId, userId });

// Validation
import { z } from 'zod';
const CreateChoreSchema = z.object({
  title: z.string().min(1).max(200),
  pointValue: z.number().int().min(1).max(1000),
});

// Database queries with Drizzle
import { db } from '@chorechamp/database';
const chores = await db.query.chores.findMany({
  where: eq(chores.householdId, householdId),
});
```

### API Pattern
```typescript
// Fastify route with validation
app.post('/chores', {
  schema: {
    body: CreateChoreSchema,
    response: { 201: ChoreResponseSchema },
  },
  preHandler: [authenticate, requireHouseholdMember],
}, async (request, reply) => {
  const chore = await choreService.create(request.body, request.user);
  return reply.status(201).send(chore);
});
```

### Real-Time Pattern
```typescript
// Server: emit to household room
io.to(`household:${householdId}`).emit('chore:completed', {
  choreId,
  completedBy: userId,
  pointsEarned,
});

// Client: subscribe to events
useEffect(() => {
  socket.on('chore:completed', handleChoreCompleted);
  return () => socket.off('chore:completed');
}, []);
```

---

## Key Business Rules

### Gamification
- **Points**: 10 base per chore, difficulty multipliers (1x/1.5x/2x)
- **Streaks**: 7-day = 3.6x retention; freeze available (1 free/week)
- **Badges**: Must feel meaningful (trivial badges show 0% impact)
- **Family Party**: Collective accountability (Habitica model)

### COPPA Compliance (Deadline: April 22, 2026)
- Parents create accounts; children are managed profiles
- No independent accounts for children under 13
- Verifiable parental consent required before adding children
- $53,088 per violation - take seriously

### Pricing
- Free: Core chores, 2-3 kids, basic gamification
- Premium: $9.99/month or $59.99/year
- 7-day trial (39.7% conversion benchmark)

---

## Current Phase

### Phase 1: Core MVP (Weeks 1-6)
**Status:** Starting

**Focus Areas:**
1. TurboRepo monorepo setup
2. Database schema (Drizzle)
3. Authentication (better-auth)
4. Household management
5. Chore CRUD + scheduling
6. Basic points + streaks + 15 badges
7. Web application shell

**Success Metrics:**
- Onboarding < 3 minutes
- Day 1 retention > 40%
- Crash-free > 99%

---

## Research Insights (Key Data)

### Competitor Weaknesses to Exploit
- OurHome: Abandoned since Sept 2023, users locked out
- S'moresUp: Kids lose interest in 2-4 weeks, $7.99/mo expensive
- Homey: "Interface feels 2018", US banking only

### Validated Features
- **7-day streak = 3.6x retention** (Duolingo)
- **Streak freeze reduces churn by 21%** (Duolingo)
- **Value-before-signup = +20% DAU** (Duolingo A/B test)
- **Visual timers help ADHD kids** (RCT, p=0.019)
- **Photo proof universally praised** (S'moresUp/Homey reviews)
- **Home screen widget requested for 4+ years** (never delivered)

### Anti-Patterns to Avoid
- Punitive streak resets (causes disengagement)
- Per-child pricing (families with 4+ kids complain)
- Mandatory signup before value (lose users)
- Cutesy design for teens (they reject it)
- Trivial badges ("You signed up" = 0% impact)

---

## Reference Implementations

Check these projects for patterns:

### FocusFlow
`/Users/daniel/Desktop/Projects/PersonalProjects/FocusFlow/`
- TurboRepo structure
- Fastify API patterns
- Drizzle ORM schema
- better-auth integration

### LifeContextCompiler
`/Users/daniel/Desktop/Projects/PersonalProjects/LifeContextCompiler/`
- Cross-platform (web + mobile)
- Expo React Native patterns

### RecordForge
`/Users/daniel/Desktop/Projects/PersonalProjects/RecordForge/`
- Swift/AppKit for macOS
- Tauri for Windows
- Native desktop architecture

---

## Work Status Updates

When completing work, update `roadmap/WORK_STATUS.md` with:
```markdown
## [Date] - [Feature/Task]

### Completed
- List of completed items

### Files Changed
- path/to/file.ts - Description of changes

### Next Steps
- What should be done next

### Blockers/Notes
- Any issues encountered
```

---

## Quick Decisions

| Question | Answer |
|----------|--------|
| Database? | PostgreSQL via Drizzle ORM |
| Auth? | better-auth |
| State? | Zustand |
| Styling? | Tailwind CSS 4 |
| Mobile offline? | WatermelonDB |
| Real-time? | Socket.io |
| Job queue? | BullMQ |
| Hosting? | Render |
| Pricing? | $9.99/mo or $59.99/yr |
| Free tier? | Yes, 2-3 kids, basic features |

---

## Emergency Contacts

- **Research:** `/_@agent-prompts/ChoreChamp/research/sessions/COMPILED_RESEARCH.md`
- **SDDs:** `/docs/sdd/SDD-00X-*.md`
- **Roadmap:** `/docs/ROADMAP.md`
- **Features:** `/docs/FEATURE_BACKLOG.md`

---

**Remember:** The #1 competitor complaint is reliability. Build offline-first. Make gamification meaningful. Ship quality.
