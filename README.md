# ChoreChamp

A gamified family chore management application that motivates children (and adults!) to complete household tasks through points, badges, streaks, and family challenges.

## Features

- **Chore Management**: Create, assign, and track household chores
- **Gamification**: Earn points, badges, and maintain streaks
- **Family Collaboration**: Family challenges and leaderboards
- **Subscriptions**: Free, Family, and Premium tiers with Stripe + RevenueCat
- **In-App Store**: ChoreCoins bundles, boosters, cosmetics, gift cards, and receipts
- **Enterprise School Edition**: District/school admin, classroom workflows, LMS sync, FERPA/COPPA controls, reports
- **API Platform**: Public REST API with OpenAPI docs, OAuth2, webhooks, marketplace approvals, and language SDKs
- **Accessibility**: Screen reader announcements, keyboard skip links, high contrast mode, reduced motion controls
- **ADHD-Friendly**: Visual timers, task chunking, and sensory customization
- **Cross-Platform**: Web, iOS, Android, macOS, and Windows apps

## Live Demo

- **Web App**: https://chorechamp-site.onrender.com
- **API**: https://chorechamp-api-u0o9.onrender.com

## Tech Stack

### Frontend

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- React Router 7
- Zustand (state management)
- TanStack Query (data fetching)
- Framer Motion (animations)

### Backend

- Fastify 5 + TypeScript
- PostgreSQL + Drizzle ORM
- better-auth (authentication)
- Socket.io (real-time updates)

### Packages (Monorepo)

- `@chorechamp/database` - Drizzle schema + 70 chore templates
- `@chorechamp/types` - Shared TypeScript interfaces
- `@chorechamp/gamification` - Points, streaks, badges logic
- `@chorechamp/api-client` - Type-safe API client + React Query hooks
- `@chorechamp/ui` - Shared UI components

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Installation

```bash
# Clone the repository
git clone https://github.com/dmhernandez2525/ChoreChamp.git
cd ChoreChamp

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit .env files with your database URL and secrets
```

### Database Setup

```bash
# Push schema to database
pnpm db:push

# Seed with 70 chore templates and 15 badges
pnpm db:seed

# Verify database setup
pnpm db:verify

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

### Development

```bash
# Start all services (web + api)
pnpm dev

# Start only web app (port 5173)
pnpm dev:web

# Start only API (port 3001)
pnpm dev:api
```

### Building

```bash
# Build all packages
pnpm build

# Type check all packages
pnpm typecheck

# Lint all packages
pnpm lint
```

## Project Structure

```
ChoreChamp/
├── apps/
│   ├── api/          # Fastify API server
│   ├── web/          # React web app
│   ├── mobile/       # React Native app (planned)
│   ├── desktop-mac/  # macOS app (planned)
│   └── desktop-windows/  # Windows app (planned)
├── packages/
│   ├── database/     # Drizzle schema + migrations
│   ├── types/        # TypeScript interfaces
│   ├── gamification/ # Game mechanics
│   ├── api-client/   # API client
│   └── ui/           # UI components
├── docs/             # Documentation
├── sdk/              # Public API SDKs (JavaScript, Python, Swift, Kotlin)
├── scripts/          # CI/CD scripts
└── render.yaml       # Render deployment config
```

## Documentation

- [Documentation Index](./docs/INDEX.md)
- [Development Roadmap](./docs/ROADMAP.md)
- [Feature Backlog](./docs/FEATURE_BACKLOG.md)
- [Database Guide](./docs/DATABASE.md)

## Environment Variables

### API

| Variable                                 | Description                                     |
| ---------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`                           | PostgreSQL connection string                    |
| `BETTER_AUTH_SECRET`                     | Secret for session signing                      |
| `BETTER_AUTH_URL`                        | API URL for auth callbacks                      |
| `CORS_ORIGIN`                            | Allowed CORS origins                            |
| `STRIPE_SECRET_KEY`                      | Stripe secret key                               |
| `STRIPE_WEBHOOK_SECRET`                  | Stripe webhook signing secret                   |
| `STRIPE_PRICE_FAMILY_MONTHLY`            | Stripe price ID for Family monthly              |
| `STRIPE_PRICE_FAMILY_ANNUAL`             | Stripe price ID for Family annual               |
| `STRIPE_PRICE_PREMIUM_MONTHLY`           | Stripe price ID for Premium monthly             |
| `STRIPE_PRICE_PREMIUM_ANNUAL`            | Stripe price ID for Premium annual              |
| `SUBSCRIPTION_GRACE_PERIOD_DAYS`         | Days to keep access after failed payment        |
| `SUBSCRIPTION_GRANDFATHERED_CUTOFF_DATE` | Cutoff date for grandfathered pricing           |
| `CANVAS_CLIENT_ID`                       | Canvas LMS OAuth client ID (optional)           |
| `CANVAS_CLIENT_SECRET`                   | Canvas LMS OAuth client secret (optional)       |
| `GOOGLE_CLASSROOM_CLIENT_ID`             | Google Classroom OAuth client ID (optional)     |
| `GOOGLE_CLASSROOM_CLIENT_SECRET`         | Google Classroom OAuth client secret (optional) |
| `CLEVER_CLIENT_ID`                       | Clever OAuth client ID (optional)               |
| `CLEVER_CLIENT_SECRET`                   | Clever OAuth client secret (optional)           |

### Web

| Variable                 | Description       |
| ------------------------ | ----------------- |
| `VITE_API_URL`           | API base URL      |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key |

### Mobile

| Variable                     | Description                |
| ---------------------------- | -------------------------- |
| `EXPO_PUBLIC_API_URL`        | API base URL               |
| `REVENUECAT_IOS_API_KEY`     | RevenueCat iOS API key     |
| `REVENUECAT_ANDROID_API_KEY` | RevenueCat Android API key |

## Deployment

The app is deployed on Render:

- Static site: `chorechamp-site`
- API server: `chorechamp-api`
- PostgreSQL: `chorechamp-db`

Deployments are triggered automatically on push to `main`.

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Push and create a PR: `gh pr create`
4. Wait for CI to pass
5. Get code review
6. Merge

## License

MIT
