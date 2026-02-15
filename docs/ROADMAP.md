# ChoreChamp Development Roadmap

**Version:** 1.0.0
**Last Updated:** 2026-02-15
**Status:** Active Development

---

## Executive Summary

ChoreChamp is a gamified family chore management application targeting the $542M parenting app market. This roadmap outlines a 16-week development plan across 4 phases, prioritizing features validated by competitor research and clinical evidence.

### Key Differentiators (Research-Validated)

1. **Bulletproof offline-first architecture** - #1 competitor complaint is reliability
2. **Deep gamification** - 7-day streak = 3.6x retention (Duolingo data)
3. **Neurodivergent-friendly** - Visual timers, task chunking (FDA-validated approaches)
4. **Cross-platform with native desktop** - Web + Mobile + macOS + Windows
5. **Value-before-signup** - +20% DAU (Duolingo A/B test)

## Current Delivery Status (Phase 12)

- [x] F12.1 Subscription tier system
- [x] F12.2 Premium feature gates
- [x] F12.3 In-app purchase store
- [x] F12.4 Enterprise and school edition
- [x] F12.5 API platform and integrations

---

## Phase 1: Core MVP (Weeks 1-6)

**Goal:** Launch functional web app + API with core chore management and basic gamification.

### Week 1-2: Foundation

#### Infrastructure Setup

- [ ] Initialize TurboRepo monorepo with pnpm workspaces
- [ ] Set up GitHub repository with branch protection
- [ ] Configure CI/CD with GitHub Actions
- [ ] Set up Render deployment (API + Database + Redis)
- [ ] Configure development environment (ESLint, Prettier, TypeScript)

#### Database & API Foundation

- [ ] Design and implement Drizzle ORM schema
  - Users, Households, Members, Chores, Completions, Rewards, Points, Badges
- [ ] Set up Fastify server with core plugins
- [ ] Implement better-auth authentication (email/password, Google OAuth)
- [ ] Create household management endpoints
- [ ] Set up Redis for caching and session management

#### Shared Packages

- [ ] `@chorechamp/types` - Shared TypeScript interfaces
- [ ] `@chorechamp/database` - Drizzle schema and migrations
- [ ] `@chorechamp/api-client` - Type-safe API client with React Query hooks

### Week 3-4: Core Features

#### Chore Management

- [ ] Chore CRUD operations (create, read, update, delete)
- [ ] 50+ pre-built chore templates organized by category
- [ ] Recurring chore scheduling (daily, weekly, monthly, custom)
- [ ] Chore assignment (specific member, anyone, rotation)
- [ ] Due date and time window configuration
- [ ] Age-appropriate chore suggestions

#### Household Management

- [ ] Create household with auto-generated invite code
- [ ] Join household via invite code
- [ ] Role-based access (Admin/Parent, Member/Child, Viewer)
- [ ] Parent-managed child accounts (no email required for kids)
- [ ] Profile customization (avatar, name, color)
- [ ] Multiple household support (divorced families use case)

#### Basic Points System

- [ ] Points earned per chore completion
- [ ] Configurable point values per chore
- [ ] Point transaction history
- [ ] Real-time point balance updates

### Week 5-6: Gamification Foundation

#### Streak System

- [ ] Individual streaks per family member
- [ ] Family streak for collective accomplishment
- [ ] Streak freeze mechanism (1 free per week, purchasable with points)
- [ ] Visual streak representation (flame icon, growth animation)
- [ ] Streak-saver push notification at end of day

#### Badge System (15 Starter Badges)

- [ ] Badge definitions and criteria evaluation
- [ ] Streak badges: Flame Keeper (7d), Streak Master (30d), Legendary (100d)
- [ ] Volume badges: Chore Champion (50), Century Club (100)
- [ ] Time badges: Early Bird, Weekend Warrior
- [ ] Family badges: Team Player, Helpful Hero
- [ ] First-time badges: First Chore, First Week, First Reward
- [ ] Badge unlock animations and celebrations

#### Completion Workflow

- [ ] Mark chore as complete
- [ ] Optional parent approval toggle (per chore)
- [ ] Approval/rejection workflow with feedback
- [ ] Completion history and analytics
- [ ] Celebration animations on completion

#### Web Application Shell

- [ ] React 19 + Vite setup with Tailwind CSS 4
- [ ] Authentication flow (signup, signin, forgot password)
- [ ] Value-before-signup onboarding (create first chore before account)
- [ ] Dashboard with today's chores overview
- [ ] Chore list and detail views
- [ ] Family management interface
- [ ] Basic responsive design

### Phase 1 Deliverables

- Functional web application
- REST API with authentication
- PostgreSQL database with core schema
- Basic gamification (points, streaks, 15 badges)
- Parent-managed child accounts
- Real-time updates via Socket.io

### Phase 1 Success Metrics

| Metric                     | Target     |
| -------------------------- | ---------- |
| Onboarding completion      | <3 minutes |
| Day 1 retention (internal) | >40%       |
| Chore completion rate      | >70%       |
| Crash-free sessions        | >99%       |

---

## Phase 2: Mobile + Advanced Gamification (Weeks 7-10)

**Goal:** Launch iOS/Android apps with full gamification suite.

### Week 7-8: Mobile Foundation

#### Expo React Native Setup

- [ ] Initialize Expo project with bare workflow
- [ ] Configure NativeWind for Tailwind styling
- [ ] Set up React Navigation with tab navigator
- [ ] Implement authentication screens
- [ ] Configure push notifications (expo-notifications)
- [ ] Set up local storage with WatermelonDB

#### Offline-First Architecture

- [ ] WatermelonDB schema matching backend
- [ ] Sync engine for background synchronization
- [ ] Conflict resolution (field-level merge, CRDT counters for points)
- [ ] Offline queue for pending operations
- [ ] Network status indicators
- [ ] Automatic retry with exponential backoff

#### Core Mobile Screens

- [ ] Dashboard (today's chores, streak, points)
- [ ] Chore list with filters and search
- [ ] Chore detail and completion flow
- [ ] Profile and settings
- [ ] Family management

### Week 9-10: Advanced Gamification

#### Full Badge System (50+ Badges)

- [ ] Expand badge categories and tiers
- [ ] Progressive badges (bronze/silver/gold)
- [ ] Hidden/secret badges for discovery
- [ ] Badge collection display
- [ ] Rarity system (common, rare, epic, legendary)

#### Family Party System (Habitica-inspired)

- [ ] Family "health" or progress meter
- [ ] Collective consequences for missed chores
- [ ] Weekly family goals and challenges
- [ ] Party dashboard showing collective status

#### Boss Battles

- [ ] Weekly family quests with point thresholds
- [ ] Visual boss representation
- [ ] Collective attack mechanics
- [ ] Boss defeat rewards and celebrations

#### Leaderboard

- [ ] Weekly family rankings (collaborative framing)
- [ ] "Family contribution" view
- [ ] Weekly MVP rotation
- [ ] Optional competitive mode

#### Photo Proof

- [ ] Camera integration for completion photos
- [ ] Photo submission workflow
- [ ] Parent review interface
- [ ] Photo storage (S3/Cloudflare R2)

#### Push Notifications

- [ ] Chore reminders (configurable timing)
- [ ] Streak-saver alerts (end of day)
- [ ] Approval request notifications (batched)
- [ ] Celebration notifications (badges, milestones)
- [ ] Granular notification controls
- [ ] Quiet hours (default 9pm-8am)

### Phase 2 Deliverables

- iOS app (TestFlight ready)
- Android app (internal testing ready)
- Full gamification suite (50+ badges, party system, boss battles)
- Offline-first mobile architecture
- Push notification system
- Photo proof feature

### Phase 2 Success Metrics

| Metric                   | Target            |
| ------------------------ | ----------------- |
| Mobile Day 7 retention   | >25%              |
| Push notification opt-in | >60%              |
| Weekly active families   | +50% from Phase 1 |
| 7-day streak achievement | >30% of users     |

---

## Phase 3: Desktop Apps + Polish (Weeks 11-14)

**Goal:** Launch native desktop apps and premium features.

### Week 11-12: Desktop Applications

#### macOS Native App (Swift/AppKit)

- [ ] Xcode project setup
- [ ] MenuBar controller for quick actions
- [ ] Main window with dashboard
- [ ] Native notifications integration
- [ ] Keychain storage for credentials
- [ ] WebSocket client for real-time updates
- [ ] Quick chore completion from menubar

#### Windows App (Tauri + React)

- [ ] Tauri project initialization
- [ ] System tray integration
- [ ] React frontend (shared with web where possible)
- [ ] Native notifications
- [ ] Secure storage for credentials
- [ ] Real-time sync

### Week 13-14: Premium Features & Polish

#### Custom Reward Catalog

- [ ] Create custom rewards (screen time, treats, activities, money)
- [ ] Point cost configuration
- [ ] Reward redemption workflow
- [ ] Parent approval for redemptions
- [ ] Redemption history

#### Visual Progress System (Forest-inspired)

- [ ] Growing garden/treehouse visualization
- [ ] Individual contribution to visual growth
- [ ] Missed chores create visible gaps
- [ ] Time-lapse view of progress

#### ADHD-Friendly Features

- [ ] Visual timer system (time shown "passing")
- [ ] Task chunking (break complex chores into steps)
- [ ] Sensory customization (muted animations, sounds)
- [ ] Consistent, predictable UI patterns
- [ ] Transition warnings with haptic feedback

#### Teen Mode

- [ ] Separate teen-appropriate UI
- [ ] Autonomy over streak participation
- [ ] Transparent privacy controls
- [ ] Optional family integration
- [ ] Minimalist, dark mode design

#### Home Screen Widgets

- [ ] iOS widget (WidgetKit)
- [ ] Android widget (Jetpack Glance)
- [ ] Today's chores summary
- [ ] Streak status display
- [ ] Quick completion actions

#### Analytics Dashboard

- [ ] Weekly/monthly completion reports
- [ ] Individual performance trends
- [ ] Family comparison (collaborative framing)
- [ ] Exportable reports

### Phase 3 Deliverables

- macOS native app
- Windows Tauri app
- Custom reward system
- Visual progress (garden/treehouse)
- ADHD-friendly features
- Teen mode
- Home screen widgets
- Analytics dashboard

### Phase 3 Success Metrics

| Metric                  | Target               |
| ----------------------- | -------------------- |
| Desktop app installs    | 10% of user base     |
| Widget usage            | >40% of mobile users |
| ADHD feature engagement | Track adoption       |
| Teen user retention     | >20% Day 30          |

---

## Phase 4: Launch Preparation (Weeks 15-16)

**Goal:** Polish, compliance verification, and launch readiness.

### Week 15: Compliance & Testing

#### COPPA Compliance (Deadline: April 22, 2026)

- [ ] Verifiable parental consent implementation
- [ ] Parent account controls child profiles architecture verified
- [ ] Data retention policy implementation
- [ ] Privacy dashboard for parents
- [ ] Separate consent for any third-party data sharing
- [ ] Legal review of privacy policy and terms
- [ ] GDPR acknowledgments for EEA users

#### App Store Preparation

- [ ] Apple Kids Category requirements verified
- [ ] Google Play Families Policy compliance
- [ ] Age ratings submission (IARC)
- [ ] App Store screenshots (all device sizes)
- [ ] App preview video (15-30 seconds)
- [ ] App descriptions and keywords optimized

#### Testing

- [ ] End-to-end test suite (Detox for mobile)
- [ ] Performance testing across devices
- [ ] Load testing for API
- [ ] Security audit
- [ ] Accessibility audit (WCAG 2.2 AA)

### Week 16: Launch

#### Marketing Launch

- [ ] Landing page live (chorechamp.com)
- [ ] Press release distributed
- [ ] Influencer campaign activated
- [ ] Social media presence established
- [ ] Email waitlist notification

#### Soft Launch (Canada/Australia)

- [ ] Deploy to production
- [ ] Monitor stability and performance
- [ ] Gather initial reviews
- [ ] Address critical issues

#### US Launch

- [ ] Full App Store availability
- [ ] Google Play availability
- [ ] Web app production deployment
- [ ] Desktop app distribution

### Phase 4 Deliverables

- COPPA-compliant application
- App Store approved listings
- Marketing website and materials
- Production deployment
- Launch in US market

### Phase 4 Success Metrics

| Metric           | Target |
| ---------------- | ------ |
| App Store rating | >4.5   |
| Crash-free rate  | >99.5% |
| Trial conversion | >40%   |
| Week 1 downloads | 1,000+ |

---

## Post-Launch Roadmap (Phase 5+)

### Short-term (Months 2-3)

- [ ] Allowance tracking with virtual money
- [ ] Google Calendar integration
- [ ] Family chat feature
- [ ] Seasonal events and limited-time badges
- [ ] Pet/character collection system

### Medium-term (Months 4-6)

- [ ] AI task chunking (break "Clean room" into steps)
- [ ] Co-parenting sync (cross-household chore management)
- [ ] Smart home integration (appliance triggers)
- [ ] Banking integration (direct allowance deposits)
- [ ] Localization (Spanish, French, German)

### Long-term (Months 7-12)

- [ ] AI-powered chore suggestions (BYOK)
- [ ] Voice assistant integration (Alexa, Google Assistant)
- [ ] School/institution partnerships
- [ ] International expansion (UK, EU, Australia)
- [ ] Enterprise/family organization tier

---

## Resource Requirements

### Development Team

| Role                 | Phase 1-2 | Phase 3-4 |
| -------------------- | --------- | --------- |
| Full-stack Developer | 1         | 1         |
| Mobile Developer     | 0.5       | 1         |
| Designer             | 0.5       | 0.5       |
| QA                   | 0         | 0.5       |

### Infrastructure Costs (Monthly Estimates)

| Scale              | Database | Redis | API  | Storage | Total |
| ------------------ | -------- | ----- | ---- | ------- | ----- |
| MVP (1K users)     | $7       | $0    | $7   | $5      | ~$20  |
| Launch (10K users) | $25      | $10   | $25  | $20     | ~$80  |
| Growth (50K users) | $100     | $40   | $100 | $80     | ~$320 |

### Third-Party Services

| Service       | Purpose        | Cost          |
| ------------- | -------------- | ------------- |
| RevenueCat    | Subscriptions  | 1% over $2.5M |
| Sentry        | Error tracking | Free tier     |
| Mixpanel      | Analytics      | Free tier     |
| Cloudflare R2 | Image storage  | ~$15/month    |

---

## Risk Mitigation

| Risk                | Likelihood | Impact   | Mitigation                                        |
| ------------------- | ---------- | -------- | ------------------------------------------------- |
| App Store rejection | Medium     | High     | Follow guidelines strictly, submit early          |
| COPPA violation     | Low        | Critical | Legal review, conservative data practices         |
| Competitor response | Low        | Medium   | Focus on differentiation (gamification depth)     |
| Poor retention      | Medium     | High     | Implement streaks from Day 1, A/B test onboarding |
| Technical debt      | Medium     | Medium   | Code reviews, comprehensive testing               |

---

## Phase 12: Monetization & Business (Weeks 41-44)

**Goal:** Launch subscription tiers, payment infrastructure, and monetization tooling.

- [x] F12.1 - Subscription tier system (Stripe + RevenueCat, 14-day trial)
- [x] F12.2 - Premium feature gates (graceful degradation + feature comparison + unlock prompts)
- [x] F12.3 - In-app purchase store (catalog, ChoreCoins bundles, receipts, refunds, parental controls, gift cards)
- [x] F12.4 - Enterprise & school edition (district/school portal, LMS configuration, compliance/reporting workflows)
- [x] F12.5 - API platform & integrations (OpenAPI public API, OAuth2, webhook subscriptions, marketplace approvals, SDK packages)

---

## Decision Log

| Date       | Decision                           | Rationale                                                   |
| ---------- | ---------------------------------- | ----------------------------------------------------------- |
| 2026-01-28 | Fastify + PostgreSQL over Firebase | Consistency with existing projects, more control            |
| 2026-01-28 | $9.99/month pricing                | Research shows premium positioning works for family apps    |
| 2026-01-28 | 7-day trial                        | 39.7% median conversion (RevenueCat data)                   |
| 2026-02-03 | 14-day trial                       | Trial uplift for family subscriptions (extended onboarding) |
| 2026-01-28 | Offline-first mobile               | #1 competitor complaint is reliability                      |

---

**Document Version:** 1.0.0
**Next Review:** End of Phase 1
