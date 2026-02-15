# SDD-019: Health & Wellness Integration (Phase 14)

**Feature IDs:** F14.1, F14.2, F14.3, F14.4, F14.5
**Status:** Implemented
**Date:** 2026-02-15

## 1. Overview

Phase 14 introduces comprehensive health and wellness tracking capabilities to ChoreChamp, enabling household members to monitor physical activity, mental health, sleep patterns, nutrition, and overall wellbeing. This phase implements five interconnected features:

- **F14.1 Activity Tracking:** Log physical activities, set goals, track progress with stats and streaks
- **F14.2 Wellness Check-ins:** Daily mood and energy tracking with trend analysis
- **F14.3 Sleep & Routine Management:** Sleep log tracking with quality metrics and bedtime routines
- **F14.4 Nutrition & Meal Planning:** Weekly meal planning with nutrition tracking and grocery integration
- **F14.5 Mental Health Support:** Mood journaling, gratitude entries, and curated mental health resources

All features are accessible through a unified WellnessHub interface with role-based access controls and household-scoped data isolation.

## 2. Architecture

### 2.1 Database Schema

All health and wellness tables are defined in `packages/database/src/schema/activity-tracking.ts`:

**activityLogs**
- Tracks individual physical activity entries
- Fields: id, userId, householdId, activityType, duration, distance, caloriesBurned, notes, loggedAt, createdAt, updatedAt
- Indexes: userId, householdId, loggedAt for efficient querying

**activityGoals**
- Stores user-defined fitness goals
- Fields: id, userId, householdId, goalType, targetValue, currentValue, unit, startDate, endDate, status, createdAt, updatedAt
- Supports weekly/monthly goals with progress tracking

**wellnessCheckIns**
- Daily mood and energy level records
- Fields: id, userId, householdId, mood, energyLevel, stress, notes, checkedInAt, createdAt, updatedAt
- Enables trend analysis over time

**sleepLogs**
- Sleep tracking with quality metrics
- Fields: id, userId, householdId, sleepStart, sleepEnd, duration, quality, notes, createdAt, updatedAt
- Calculates sleep duration automatically

**mealPlans**
- Weekly meal planning entries
- Fields: id, userId, householdId, dayOfWeek, mealType, recipeName, ingredients, calories, protein, carbs, fats, notes, createdAt, updatedAt
- Links to grocery lists for shopping integration

**mentalHealthResources**
- Curated mental health content library
- Fields: id, category, title, description, url, resourceType, createdAt, updatedAt
- Admin-managed resource collection

**gratitudeEntries**
- Gratitude journaling for mental wellbeing
- Fields: id, userId, householdId, entry, createdAt, updatedAt
- Private to individual users

### 2.2 API Routes

All wellness endpoints are consolidated in `apps/api/src/routes/health-wellness.ts` and registered under the `/:householdId/wellness` prefix in the main API router.

**Route Registration:**
```typescript
router.use('/:householdId/wellness', requireAuth, healthWellnessRouter);
```

The health-wellness router handles all CRUD operations for the seven data models, with automatic householdId scoping and user authentication.

### 2.3 Frontend Architecture

**WellnessHub Page** (`apps/web/src/pages/WellnessHub.tsx`)
- Main container with 5-tab navigation
- Tabs: Activity, Check-ins, Sleep, Meals, Mental Health
- Each tab lazy-loads its respective component
- Shared header with household context

**Tab Components:**
- ActivityTab: Activity logging, goal management, stats dashboard
- CheckInTab: Daily check-in form, mood trends, energy graphs
- SleepTab: Sleep log entry, sleep quality charts, routine suggestions
- MealsTab: Weekly meal planner, nutrition summary, grocery export
- MentalHealthTab: Mood journal, gratitude entries, resource library

### 2.4 API Client

**Location:** `packages/api-client/src/wellness.ts`

Provides typed API methods for all wellness endpoints:
- `logActivity()`, `getActivityStats()`, `createActivityGoal()`
- `createCheckIn()`, `getWellnessTrends()`
- `logSleep()`, `getSleepStats()`
- `createMealPlan()`, `getMealPlans()`, `updateMealPlan()`, `deleteMealPlan()`
- `getMentalHealthResources()`, `createGratitudeEntry()`, `getMoodJournal()`

**React Query Hooks:** `packages/api-client/src/hooks/useWellness.ts`
- `useActivityLogs()`, `useActivityStats()`, `useActivityGoals()`
- `useWellnessCheckIns()`, `useWellnessTrends()`
- `useSleepLogs()`, `useSleepStats()`
- `useMealPlans()`, `useMentalHealthResources()`, `useGratitudeEntries()`
- Automatic caching, refetching, and optimistic updates

## 3. API Endpoints

### 3.1 Activity Tracking (F14.1)

**GET** `/:householdId/wellness/activity-logs`
- Query params: `userId`, `startDate`, `endDate`, `activityType`
- Returns: Array of activity log entries

**POST** `/:householdId/wellness/activity-logs`
- Body: `{ activityType, duration, distance?, caloriesBurned?, notes?, loggedAt? }`
- Returns: Created activity log

**GET** `/:householdId/wellness/activity-stats`
- Query params: `userId`, `period` (week|month|year)
- Returns: Aggregated stats (total duration, calories, distance, streaks)

**GET** `/:householdId/wellness/activity-goals`
- Query params: `userId`, `status` (active|completed|expired)
- Returns: Array of activity goals

**POST** `/:householdId/wellness/activity-goals`
- Body: `{ goalType, targetValue, unit, startDate, endDate }`
- Returns: Created goal

**PATCH** `/:householdId/wellness/activity-goals/:goalId`
- Body: `{ currentValue?, status? }`
- Returns: Updated goal

### 3.2 Wellness Check-ins (F14.2)

**GET** `/:householdId/wellness/check-ins`
- Query params: `userId`, `startDate`, `endDate`
- Returns: Array of check-in records

**POST** `/:householdId/wellness/check-ins`
- Body: `{ mood, energyLevel, stress?, notes?, checkedInAt? }`
- Returns: Created check-in

**GET** `/:householdId/wellness/trends`
- Query params: `userId`, `period` (week|month)
- Returns: Trend data for mood, energy, stress with averages and patterns

### 3.3 Sleep & Routine (F14.3)

**GET** `/:householdId/wellness/sleep-logs`
- Query params: `userId`, `startDate`, `endDate`
- Returns: Array of sleep log entries

**POST** `/:householdId/wellness/sleep-logs`
- Body: `{ sleepStart, sleepEnd, quality, notes? }`
- Returns: Created sleep log (duration calculated automatically)

**GET** `/:householdId/wellness/sleep-stats`
- Query params: `userId`, `period` (week|month)
- Returns: Sleep statistics (average duration, quality score, consistency)

### 3.4 Nutrition & Meal Planning (F14.4)

**GET** `/:householdId/wellness/meal-plans`
- Query params: `userId`, `weekOf`
- Returns: Array of meal plans for the specified week

**POST** `/:householdId/wellness/meal-plans`
- Body: `{ dayOfWeek, mealType, recipeName, ingredients?, calories?, protein?, carbs?, fats?, notes? }`
- Returns: Created meal plan

**PATCH** `/:householdId/wellness/meal-plans/:mealPlanId`
- Body: Partial meal plan fields
- Returns: Updated meal plan

**DELETE** `/:householdId/wellness/meal-plans/:mealPlanId`
- Returns: Success confirmation

### 3.5 Mental Health Support (F14.5)

**GET** `/:householdId/wellness/mental-health/resources`
- Query params: `category` (meditation|therapy|crisis|exercise|sleep)
- Returns: Array of mental health resources

**POST** `/:householdId/wellness/mental-health/resources`
- Body: `{ category, title, description, url, resourceType }`
- Returns: Created resource (admin only)

**GET** `/:householdId/wellness/mental-health/gratitude`
- Query params: `userId`, `limit`
- Returns: User's gratitude entries

**POST** `/:householdId/wellness/mental-health/gratitude`
- Body: `{ entry }`
- Returns: Created gratitude entry

**GET** `/:householdId/wellness/mental-health/mood-journal`
- Query params: `userId`, `startDate`, `endDate`
- Returns: Combined mood data from check-ins for journaling view

## 4. Data Models

### 4.1 ActivityLog
Represents a single physical activity session. Supports various activity types (running, cycling, swimming, strength training, yoga, etc.). Includes optional fields for distance and calorie tracking. Each log is timestamped for historical analysis.

### 4.2 ActivityGoal
Defines user fitness objectives with target values and deadlines. Tracks progress via currentValue updates. Status transitions: active (in progress), completed (target reached), expired (deadline passed). Supports daily, weekly, and monthly goal periods.

### 4.3 WellnessCheckIn
Daily snapshot of mental and physical state. Mood and energy levels rated on numeric scales. Stress level optional. Enables longitudinal wellbeing analysis and early intervention for declining trends.

### 4.4 SleepLog
Captures sleep sessions with start/end times and quality ratings. Duration calculated server-side to ensure consistency. Quality scale helps identify sleep pattern improvements. Notes field for factors affecting sleep (caffeine, stress, exercise).

### 4.5 MealPlan
Weekly meal planning entries with nutritional data. DayOfWeek (1-7) and mealType (breakfast, lunch, dinner, snack) organize the week. Macronutrient tracking (protein, carbs, fats) supports dietary goals. Ingredients list integrates with grocery shopping features.

### 4.6 MentalHealthResource
Admin-curated library of mental health content. Categories include meditation guides, therapy resources, crisis hotlines, exercise programs, and sleep hygiene tips. ResourceType distinguishes articles, videos, tools, and external services.

### 4.7 GratitudeEntry
User's private gratitude journal. Simple text entries with timestamps. Promotes positive psychology practices and mindfulness. Displayed chronologically in mental health tab.

## 5. Frontend Components

### 5.1 WellnessHub
Main container page managing tab navigation and shared state. Fetches household context and user permissions. Renders tab bar with icons for each wellness category. Handles deep linking to specific tabs via URL parameters.

### 5.2 ActivityTab
**Features:**
- Activity log form with type selector, duration/distance inputs
- Goal creation modal with target setting
- Stats dashboard showing weekly/monthly totals
- Activity history list with filtering
- Streak counter for consecutive active days
- Charts for activity distribution by type

**Key Components:**
- ActivityLogForm: Input form with validation
- ActivityGoalCard: Goal progress display with percentage bar
- ActivityStatsGrid: Metric cards (total time, calories, distance)
- ActivityChart: Bar chart of weekly activity

### 5.3 CheckInTab
**Features:**
- Quick check-in form (mood, energy, stress sliders)
- Trend graphs for 7-day and 30-day periods
- Average scores with trend indicators
- Check-in history with notes
- Reminder settings for daily check-ins

**Key Components:**
- CheckInForm: Slider inputs with emoji indicators
- TrendChart: Line chart showing mood/energy over time
- CheckInHistory: Chronological list with filtering

### 5.4 SleepTab
**Features:**
- Sleep log entry with time pickers
- Sleep quality selector (1-5 stars)
- Sleep statistics (average duration, quality score)
- Sleep consistency indicator
- Bedtime routine suggestions
- Sleep goal tracking

**Key Components:**
- SleepLogForm: Time range picker with quality rating
- SleepStatsCard: Weekly sleep summary
- SleepChart: Bar chart of daily sleep duration
- RoutineChecklist: Bedtime routine tracker

### 5.5 MealsTab
**Features:**
- Weekly calendar view of meal plans
- Meal entry form with recipe and nutrition inputs
- Nutrition summary (daily/weekly totals)
- Grocery list export from ingredients
- Recipe suggestions based on dietary preferences
- Meal plan templates

**Key Components:**
- MealPlanCalendar: 7-day grid view
- MealEntryModal: Form for creating/editing meals
- NutritionSummary: Macro breakdown with progress bars
- GroceryListExporter: Aggregates ingredients for shopping

### 5.6 MentalHealthTab
**Features:**
- Mood journal with prompts
- Gratitude entry form
- Resource library with categories
- Crisis resources (always visible)
- Mood pattern analysis
- Guided journaling templates

**Key Components:**
- MoodJournalEntry: Text area with mood selector
- GratitudeForm: Simple text input with inspiration prompts
- ResourceLibrary: Categorized list with search
- CrisisResourceBanner: Prominent emergency contact info

## 6. Security

### 6.1 Authentication
All wellness endpoints require authentication via the `requireAuth` middleware. Unauthenticated requests return 401 Unauthorized. User identity extracted from JWT tokens.

### 6.2 Authorization
**Household Scoping:** All queries filter by householdId from route parameters. Users can only access data for households they belong to. Middleware validates household membership before processing requests.

**User Data Privacy:**
- Gratitude entries are private (userId scoped, not shared with household)
- Mood journal only visible to user and admins with explicit permission
- Activity logs and meal plans visible to household members (configurable)
- Mental health resources are public within household

**Role-Based Access:**
- Standard users: CRUD on own data
- Parents/Guardians: View children's wellness data
- Admins: Full access to household wellness data, resource management

### 6.3 Data Validation
All input validated using Zod schemas before database operations. Type-safe request bodies prevent injection attacks. Date ranges validated to prevent performance issues from unbounded queries.

### 6.4 Rate Limiting
Wellness endpoints subject to standard API rate limits (100 requests per 15 minutes per user). Prevents abuse of stats aggregation queries.

## 7. Testing

### 7.1 Unit Tests

**Schema Validation Tests** (`packages/database/src/schema/__tests__/activity-tracking.test.ts`)
- Validates all table schemas have required fields
- Tests foreign key relationships (userId, householdId)
- Ensures indexes are properly configured
- Verifies timestamp fields (createdAt, updatedAt)

**API Route Tests** (`apps/api/src/routes/__tests__/health-wellness.test.ts`)
- Endpoint coverage for all 18 endpoints
- Request validation (missing fields, invalid types)
- Authorization checks (household access control)
- Response format validation
- Error handling (404s, 400s, 500s)

**Frontend Component Tests** (`apps/web/src/pages/__tests__/WellnessHub.test.tsx`)
- Tab navigation functionality
- Form submission and validation
- Data fetching with loading/error states
- Chart rendering with mock data
- User interaction flows (log activity, create goal, etc.)

### 7.2 Integration Tests

**Full Workflow Tests:**
- Create activity log, verify in stats endpoint
- Set activity goal, update progress, mark complete
- Log sleep for 7 days, verify sleep stats calculation
- Create meal plan for week, export grocery list
- Submit gratitude entries, verify mood journal aggregation

**Data Consistency:**
- Activity goal progress updates on new activity logs
- Wellness trends recalculate on new check-ins
- Sleep stats reflect latest log entries
- Meal plan nutrition totals aggregate correctly

### 7.3 E2E Tests

**User Journeys:**
1. User navigates to WellnessHub, completes daily check-in
2. User logs workout, sees updated activity stats
3. User creates weekly meal plan, exports grocery list
4. User writes gratitude entry, browses mental health resources
5. User sets sleep goal, logs sleep for week, views progress

**Cross-Feature Integration:**
- Activity logged triggers achievement notification (Phase 10)
- Wellness trends appear in user dashboard (Phase 1)
- Meal plans sync with grocery list feature (Phase 7)
- Mental health check-ins trigger support prompts (automated care)

### 7.4 Test Coverage Requirements

Per global testing standards:
- Unit test coverage: 80% minimum
- Integration test coverage: 80% minimum
- E2E coverage: 80% of critical paths
- Branch coverage: 80% minimum
- Function coverage: 80% minimum
- Line coverage: 80% minimum

All tests run in CI pipeline before merge. Coverage reports generated on each PR. Failing tests block deployment.

---

## Related Documents

- **PRD-014:** Health & Wellness Integration (Product Requirements)
- **SDD-010:** Gamification System (Achievement integration)
- **SDD-007:** Shopping & Budgeting (Grocery list integration)
- **API Documentation:** `/docs/api/wellness-endpoints.md`

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-15 | 1.0 | Initial implementation of Phase 14 |
