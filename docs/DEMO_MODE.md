# Demo Mode

ChoreChamp supports an environment-based demo mode for portfolio showcasing and demonstration purposes.

## Overview

When demo mode is enabled, the application runs with mock data and simulated functionality, allowing visitors to explore the app without needing:
- Real authentication credentials
- Database connections
- API server running

## Configuration

### Environment Variable

Set the following environment variable to enable demo mode:

```env
VITE_DEMO_MODE=true
```

### For Local Development

Create a `.env.local` file in the `apps/web` directory:

```env
VITE_DEMO_MODE=true
```

Then run the development server:

```bash
pnpm dev:web
```

### For Production (Render)

The `render.yaml` file includes the `VITE_DEMO_MODE` environment variable set to `true` for the deployed site, making it a portfolio-ready demonstration.

## Architecture

```
Landing Page
    |
    v
Auth Pages (/login, /signup)
    |
    +-- DEMO_MODE=false --> Real Authentication Flow
    |
    +-- DEMO_MODE=true  --> Demo Role Selector
                              |
                              v
                        Demo Experience
                        (/demo/parent, /demo/child)
```

## Demo Roles

| Role   | Description                                            |
|--------|--------------------------------------------------------|
| Parent | Manage chores, approve completions, view all children  |
| Child  | Complete chores, earn points, redeem rewards           |

## Demo Data

When in demo mode, the app uses the `DemoContext` which provides:

### Demo Household
- **Name**: The Johnson Family
- **Members**: 5 family members (2 parents, 2 children, 1 teen)
- **Features**: Premium subscription with all features enabled

### Demo Members
| Name           | Role   | Points | Streak |
|----------------|--------|--------|--------|
| Sarah (Mom)    | Parent | N/A    | N/A    |
| Mike (Dad)     | Parent | N/A    | N/A    |
| Emma           | Child  | 385    | 12 days|
| Lucas          | Child  | 210    | 5 days |
| Olivia         | Teen   | 520    | 8 days |

### Demo Chores
- 8 pre-configured chores across different categories
- Various difficulty levels (easy, medium, hard)
- Mix of daily and weekly schedules
- Some require approval, others auto-complete

### Demo Rewards
- 6 rewards with varying point costs
- Categories: screen time, activities, privileges, money
- Some with limited quantity

## Routes

| Route                    | Description                    |
|--------------------------|--------------------------------|
| `/demo/parent`           | Parent dashboard view          |
| `/demo/child`            | Child dashboard view           |
| `/demo/:role/rewards`    | Rewards store for role         |
| `/demo/:role/leaderboard`| Family leaderboard             |

## Features Available in Demo Mode

- Complete chores and earn points
- View streaks and achievements
- Approve/reject chores (parent role)
- Check the leaderboard
- Browse and redeem rewards
- View activity feed

## Limitations

In demo mode:
- Changes are temporary and reset when exiting
- Cannot create new chores or rewards
- Cannot add family members
- No push notifications
- No real data persistence

## Implementation Files

| File                                  | Purpose                              |
|---------------------------------------|--------------------------------------|
| `src/lib/demo-mode.ts`                | Demo mode configuration              |
| `src/context/DemoContext.tsx`         | Demo data provider and state         |
| `src/components/DemoRoleSelector.tsx` | Role selection UI                    |
| `src/pages/DemoDashboard.tsx`         | Main demo dashboard                  |
| `src/pages/DemoRewards.tsx`           | Demo rewards store                   |
| `src/pages/DemoLeaderboard.tsx`       | Demo leaderboard                     |

## Testing Demo Mode

```bash
# Start with demo mode enabled
VITE_DEMO_MODE=true pnpm dev:web

# Verify demo works without API keys
unset DATABASE_URL BETTER_AUTH_SECRET BETTER_AUTH_URL
VITE_DEMO_MODE=true pnpm dev:web
```

## Disabling Demo Mode

To run the app in normal (production) mode:

1. Remove or set `VITE_DEMO_MODE=false` in environment
2. Ensure all required environment variables are set:
   - `VITE_API_URL`
   - Backend API with `DATABASE_URL`, `BETTER_AUTH_SECRET`, etc.
