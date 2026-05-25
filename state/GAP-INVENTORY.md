# ChoreChamp Gap Inventory

**Generated:** 2026-03-29
**Baseline:** 0 TS errors, 31 lint warnings, 499+1442 tests pass, builds clean
**Prior audit:** 4-agent adversarial audit completed 2026-03-28

---

## Tier A (Critical) - Breaks functionality, security, or deployment

- [ ] GAP-001: [Tier A] Auth middleware swallows ALL errors as 401
  - **Requirement:** Security / REQ-001
  - **Current state:** apps/api/src/middleware/auth.ts catch block returns 401 for DB outages
  - **Expected state:** Discriminate auth errors from infrastructure errors; return 500 for non-auth failures
  - **Status:** FIXED (PR #230 partial, this session completed fix in uncommitted changes)

- [ ] GAP-002: [Tier A] `getTodaysChores()` client calls wrong API path
  - **Requirement:** REQ-037 (chore list)
  - **Current state:** packages/api-client/src/client.ts calls `/${householdId}/chores/today` but route is at `/schedule/today`
  - **Status:** FIXED (uncommitted change from this session)

- [ ] GAP-003: [Tier A] `sameSite: 'none'` cookies in all environments
  - **Requirement:** Security
  - **Current state:** apps/api/src/lib/auth.ts:49 sets `sameSite: 'none'` unconditionally
  - **Expected state:** `sameSite: 'lax'` in dev, `sameSite: 'none'` in production only
  - **Status:** FIXED (uncommitted change from this session)

- [ ] GAP-004: [Tier A] `optionalAuth` swallows ALL errors silently
  - **Requirement:** Security
  - **Current state:** apps/api/src/middleware/auth.ts empty catch block
  - **Expected state:** Log the error at warn level
  - **Status:** FIXED (uncommitted change from this session)

- [ ] GAP-005: [Tier A] Social provider credentials fall back to empty strings
  - **Requirement:** REQ-002, REQ-003
  - **Current state:** apps/api/src/lib/auth.ts initializes Google/Apple with empty clientId
  - **Expected state:** Only register providers when credentials are present
  - **Status:** FIXED (uncommitted change from this session)

- [ ] GAP-006: [Tier A] 18 e2e tautological assertions (|| true, impossible to fail)
  - **Requirement:** Test integrity
  - **Current state:** 18 expect() calls use `|| true` across e2e specs
  - **Expected state:** Each assertion tests something meaningful or is removed
  - **Status:** OPEN

- [ ] GAP-007: [Tier A] 16 console.log statements in production page code
  - **Requirement:** Code quality
  - **Current state:** 16 console.log calls across 8 page files
  - **Expected state:** Zero console.log in production code
  - **Status:** OPEN

---

## Tier B (Important) - Incomplete, degraded, or creates risk

- [ ] GAP-008: [Tier B] 17 pages missing Array.isArray guards (crash risk)
  - **Requirement:** All pages (resilience)
  - **Current state:** SmartAutomation, AdminAnalytics, FinancialScheduling, CommunityHub, HouseholdDashboard + 12 more
  - **Expected state:** Array.isArray guards on all API hook data before .map/.filter/.reduce
  - **Status:** OPEN (5 high risk, 12 lower risk)

- [ ] GAP-009: [Tier B] 14 pages have zero error UI
  - **Requirement:** UX resilience
  - **Current state:** Activity, Analytics, BossBattle, CreateChore, Dashboard, FamilyManagement, HouseholdDashboard, HouseholdSettings, Leaderboard, MemberBadges, MemberPoints, MemberStreaks, Settings, TemplateBrowser
  - **Expected state:** Each page renders error state when API fails
  - **Status:** OPEN

- [ ] GAP-010: [Tier B] 3 stale closure bugs in BoardPage.tsx
  - **Requirement:** REQ-050 (board)
  - **Current state:** BoardPage.tsx lines 113, 117, 122 missing deps in useCallback
  - **Expected state:** Include mutation functions in dependency arrays
  - **Status:** OPEN

- [ ] GAP-011: [Tier B] 392 duplicate .js/.tsx file pairs (dead code)
  - **Requirement:** Code hygiene
  - **Current state:** .js files left from TS migration bloat module graph
  - **Expected state:** Only .tsx sources, no duplicate .js files
  - **Status:** OPEN

- [ ] GAP-012: [Tier B] 18 unit test files never import code they test
  - **Requirement:** Test integrity
  - **Current state:** 18 files test local constants, not production code
  - **Expected state:** Tests import and test actual production modules
  - **Status:** OPEN

- [ ] GAP-013: [Tier B] Gamification package has 0 tests
  - **Requirement:** REQ-016 through REQ-026
  - **Current state:** packages/gamification/ has --passWithNoTests flag
  - **Expected state:** Tests for points, streaks, badges core logic
  - **Status:** OPEN

- [ ] GAP-014: [Tier B] Phases 14-18 route files return mock/hardcoded data
  - **Requirement:** REQ-068 through REQ-092
  - **Current state:** health-wellness, advanced-analytics, community-social, smart-automation, communication-calendar, financial-scheduling return fabricated data
  - **Expected state:** DB-backed implementations or honest "not implemented" status
  - **Status:** OPEN (noted but large scope)

- [ ] GAP-015: [Tier B] 1.8MB web bundle with no code splitting
  - **Requirement:** Performance
  - **Current state:** Single chunk, Vite warns about size
  - **Expected state:** Lazy-loaded routes with React.lazy()
  - **Status:** OPEN

---

## Tier C (Completeness) - Polish, coverage, standards

- [ ] GAP-016: [Tier C] 31 ESLint exhaustive-deps warnings
  - **Status:** OPEN (3 real bugs in BoardPage, rest intentional)

- [ ] GAP-017: [Tier C] 419 catch(() => false) in e2e tests (swallowed errors)
  - **Status:** OPEN (systemic pattern, not individual fix)

- [ ] GAP-018: [Tier C] 350 waitForTimeout() calls in e2e tests
  - **Status:** OPEN (systemic flakiness pattern)

- [ ] GAP-019: [Tier C] ReportCards page uses fully hardcoded mock data
  - **Status:** OPEN

- [ ] GAP-020: [Tier C] 7 pages use raw fetch() instead of shared API hooks
  - **Status:** OPEN

- [ ] GAP-021: [Tier C] render.yaml missing env vars (REDIS_URL, S3_*, OAuth)
  - **Status:** OPEN

- [ ] GAP-022: [Tier C] S3 var name mismatch between turbo.json and .env.example
  - **Status:** OPEN

- [ ] GAP-023: [Tier C] leaderboard API returns hardcoded completedChores: 0
  - **Status:** OPEN

- [ ] GAP-024: [Tier C] 5 Dependabot PRs open (#175, #176, #179, #180, #181)
  - **Status:** OPEN (2 safe to merge: #179 esbuild, #181 expo-notifications)
