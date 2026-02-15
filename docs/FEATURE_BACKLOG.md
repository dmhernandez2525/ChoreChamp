# ChoreChamp Feature Backlog

**Version:** 1.0.0
**Last Updated:** 2026-02-15
**Status:** Active

---

## Priority Definitions

| Priority | Definition                          | Timeline               |
| -------- | ----------------------------------- | ---------------------- |
| **P0**   | Must-have for MVP launch            | Phase 1 (Weeks 1-6)    |
| **P1**   | Critical for retention/monetization | Phase 2-3 (Weeks 7-14) |
| **P2**   | Competitive advantage               | Phase 4+               |
| **P3**   | Nice-to-have                        | Post-launch            |

---

## P0 - Must Have (MVP)

### Authentication & Accounts

| Feature                           | Description                                   | Research Justification                    |
| --------------------------------- | --------------------------------------------- | ----------------------------------------- |
| **Email/Password Auth**           | Standard email signup with verification       | Industry standard                         |
| **Google OAuth**                  | One-tap Google sign-in                        | Reduces friction                          |
| **Apple Sign-In**                 | Required for iOS App Store                    | Apple requirement                         |
| **Parent-Managed Child Accounts** | Kids don't need email/device                  | OurHome praised feature; COPPA compliance |
| **Household Creation**            | Create family with auto-generated invite code | Core functionality                        |
| **Join Household**                | Join existing family via invite code          | Core functionality                        |
| **Role-Based Access**             | Parent (admin), Child, Teen, Viewer roles     | Required for permissions                  |

### Chore Management

| Feature                          | Description                           | Research Justification            |
| -------------------------------- | ------------------------------------- | --------------------------------- |
| **Chore CRUD**                   | Create, read, update, delete chores   | Core functionality                |
| **Chore Templates**              | 50+ pre-built chores by category      | "Quick setup" reduces abandonment |
| **Recurring Scheduling**         | Daily, weekly, monthly, custom        | Essential for routine chores      |
| **"After Last Done" Recurrence** | Repeat X days after completion        | OurHome's most praised feature    |
| **Chore Assignment**             | Assign to specific member or "anyone" | Core functionality                |
| **Due Date/Time Window**         | When chore should be completed        | Core functionality                |
| **Category Organization**        | Kitchen, Bathroom, Bedroom, etc.      | Improves navigation               |
| **Age-Appropriate Suggestions**  | Suggest chores based on child age     | MyFamiliz feature users love      |

### Points System

| Feature                       | Description                          | Research Justification       |
| ----------------------------- | ------------------------------------ | ---------------------------- |
| **Points Per Chore**          | Configurable point value             | Foundation of gamification   |
| **Point Balance Display**     | Current and lifetime points          | Visibility drives engagement |
| **Point Transaction History** | Log of all point changes             | Transparency                 |
| **Real-Time Updates**         | Instant point updates across devices | Expectation from gaming      |

### Streak System

| Feature                           | Description                               | Research Justification        |
| --------------------------------- | ----------------------------------------- | ----------------------------- |
| **Individual Streaks**            | Per-child streak tracking                 | 7-day streak = 3.6x retention |
| **Family Streak**                 | Collective streak when all complete       | Drives family accountability  |
| **Streak Freeze**                 | Protect streak (1 free/week, then points) | Reduces churn by 21%          |
| **Visual Streak Display**         | Flame icon that grows                     | Duolingo pattern              |
| **Streak Milestone Celebrations** | Celebrate 7, 30, 100 days                 | Reinforces behavior           |

### Badge System (15 Starter)

| Badge               | Criteria                         | Rarity    |
| ------------------- | -------------------------------- | --------- |
| **First Steps**     | Complete first chore             | Common    |
| **Week One**        | Complete 7 days of app usage     | Common    |
| **Flame Keeper**    | 7-day streak                     | Common    |
| **Early Bird**      | Complete chore before 8am        | Common    |
| **Night Owl**       | Complete chore after 8pm         | Common    |
| **Team Player**     | Help achieve family goal         | Common    |
| **Chore Champion**  | Complete 50 chores (lifetime)    | Rare      |
| **Century Club**    | Complete 100 chores (lifetime)   | Rare      |
| **Weekend Warrior** | Complete all weekend chores      | Rare      |
| **Streak Master**   | 30-day streak                    | Rare      |
| **Helping Hand**    | Complete 10 "anyone" chores      | Rare      |
| **Consistent**      | Complete chores 4 weeks straight | Epic      |
| **Family MVP**      | Most points in a week            | Epic      |
| **Legendary**       | 100-day streak                   | Legendary |
| **Completionist**   | Earn all other badges            | Legendary |

### Completion Workflow

| Feature                    | Description                           | Research Justification    |
| -------------------------- | ------------------------------------- | ------------------------- |
| **Mark Complete**          | One-tap completion                    | Core functionality        |
| **Parent Approval Toggle** | Per-chore setting                     | S'moresUp praised feature |
| **Approval/Rejection**     | Parent reviews with optional feedback | Accountability            |
| **Completion History**     | Log of all completions                | Transparency              |
| **Celebration Animations** | Confetti, sounds on completion        | Duolingo pattern          |

### Notifications

| Feature                | Description                        | Research Justification              |
| ---------------------- | ---------------------------------- | ----------------------------------- |
| **Push Notifications** | Core notification delivery         | 95% churn without pushes in 90 days |
| **Chore Reminders**    | Notify when chores due             | Core functionality                  |
| **Streak-Saver Alert** | End-of-day reminder                | Protects engagement                 |
| **Approval Requests**  | Notify parent of pending approvals | Workflow completion                 |
| **Celebration Alerts** | Notify on achievements             | Positive reinforcement              |

### Web Application

| Feature                    | Description                       | Research Justification |
| -------------------------- | --------------------------------- | ---------------------- |
| **Responsive Dashboard**   | Overview of family activity       | Core functionality     |
| **Chore List View**        | See all chores with filters       | Core functionality     |
| **Family Management**      | Add/edit members                  | Core functionality     |
| **Settings**               | Notification, account settings    | Core functionality     |
| **Value-Before-Signup**    | Create first chore before account | +20% DAU (Duolingo)    |
| **Under 3-Min Onboarding** | Quick setup with templates        | Reduces abandonment    |

### Real-Time Sync

| Feature                 | Description                          | Research Justification |
| ----------------------- | ------------------------------------ | ---------------------- |
| **WebSocket Updates**   | Live updates across devices          | User expectation       |
| **Optimistic UI**       | Instant feedback, sync in background | Better UX              |
| **Conflict Resolution** | Handle concurrent edits              | Data integrity         |

---

## P1 - Critical for Retention

### Advanced Gamification

| Feature                         | Description                | Research Justification     |
| ------------------------------- | -------------------------- | -------------------------- |
| **Full Badge Collection (50+)** | Expanded badge categories  | Long-term engagement       |
| **Progressive Badges**          | Bronze/Silver/Gold tiers   | Gives progression          |
| **Family Party System**         | Collective health/progress | Habitica's best feature    |
| **Boss Battles**                | Weekly family quests       | Variety in gameplay        |
| **Visual Progress**             | Growing garden/treehouse   | Forest app pattern         |
| **Leaderboard**                 | Weekly family rankings     | +25% completion (Duolingo) |

### Mobile Application

| Feature             | Description                              | Research Justification  |
| ------------------- | ---------------------------------------- | ----------------------- |
| **iOS App**         | Native iOS experience                    | Platform coverage       |
| **Android App**     | Native Android experience                | Platform coverage       |
| **Offline Mode**    | Works without internet                   | #1 competitor complaint |
| **Background Sync** | Sync when online                         | Reliability             |
| **Deep Linking**    | Open specific screens from notifications | UX improvement          |

### Photo Proof

| Feature           | Description                   | Research Justification          |
| ----------------- | ----------------------------- | ------------------------------- |
| **Photo Capture** | Take photo of completed chore | S'moresUp/Homey praised feature |
| **Photo Review**  | Parent views and approves     | Accountability                  |
| **Photo Storage** | Secure cloud storage          | Required for feature            |

### Custom Rewards

| Feature                 | Description                                | Research Justification    |
| ----------------------- | ------------------------------------------ | ------------------------- |
| **Reward Catalog**      | Create custom rewards                      | All competitors have this |
| **Reward Types**        | Screen time, money, privileges, activities | Flexibility               |
| **Point Costs**         | Set cost per reward                        | Economy balance           |
| **Redemption Workflow** | Request, approve, fulfill                  | Complete loop             |
| **Redemption History**  | Track past redemptions                     | Transparency              |

### ADHD-Friendly Features

| Feature                 | Description                   | Research Justification      |
| ----------------------- | ----------------------------- | --------------------------- |
| **Visual Timer**        | Time shown "passing"          | RCT-validated (p=0.019)     |
| **Task Steps**          | Break chores into micro-steps | Improves completion quality |
| **Sensory Settings**    | Toggle animations, sounds     | Reduces overwhelm           |
| **Consistent UI**       | Predictable layouts           | Reduces cognitive load      |
| **Transition Warnings** | Alerts before task changes    | Helps with transitions      |

### Notifications (Advanced)

| Feature               | Description                    | Research Justification            |
| --------------------- | ------------------------------ | --------------------------------- |
| **Granular Controls** | Per-notification-type toggles  | "All or nothing" frustrates users |
| **Quiet Hours**       | No notifications 9pm-8am       | Respect family time               |
| **Smart Batching**    | Combine multiple notifications | Reduce noise                      |
| **Frequency Caps**    | Max 3 reminders/day            | Prevent burnout                   |

### Teen Mode

| Feature                  | Description                    | Research Justification           |
| ------------------------ | ------------------------------ | -------------------------------- |
| **Teen UI**              | Minimalist, dark mode option   | Teens reject "kiddie" interfaces |
| **Optional Streaks**     | Can opt out of streak pressure | Teen research findings           |
| **Privacy Controls**     | Choose what parents see        | Autonomy is paramount            |
| **Peer-Oriented Design** | Less family-centric framing    | 2.3x better engagement           |

### Analytics Dashboard

| Feature               | Description              | Research Justification |
| --------------------- | ------------------------ | ---------------------- |
| **Weekly Reports**    | Completion rates, trends | Parent insight         |
| **Individual Stats**  | Per-child performance    | Track progress         |
| **Family Comparison** | Collaborative framing    | Not competitive        |
| **Export**            | Download reports         | Parent request         |

### Web Interface (Parent Admin)

| Feature                   | Description                    | Research Justification         |
| ------------------------- | ------------------------------ | ------------------------------ |
| **Full Web Dashboard**    | Desktop-friendly admin         | Most-requested missing feature |
| **Bulk Chore Management** | Manage multiple chores at once | Efficiency                     |
| **Calendar View**         | See chores on calendar         | Visualization                  |

---

## P2 - Competitive Advantage

### Desktop Applications

| Feature                   | Description                  | Research Justification |
| ------------------------- | ---------------------------- | ---------------------- |
| **macOS Native App**      | Swift/AppKit menubar app     | Platform completeness  |
| **Windows App**           | Tauri + React                | Platform completeness  |
| **Menubar Quick Actions** | Complete chores from menubar | Convenience            |
| **Desktop Notifications** | Native system notifications  | Engagement             |

### Home Screen Widgets

| Feature            | Description                   | Research Justification                  |
| ------------------ | ----------------------------- | --------------------------------------- |
| **iOS Widget**     | Today's chores on home screen | Requested for 4+ years, never delivered |
| **Android Widget** | Today's chores on home screen | ADHD users need external cues           |
| **Streak Display** | Show current streak           | Daily reminder                          |

### Responsibilities vs Jobs

| Feature                | Description                  | Research Justification         |
| ---------------------- | ---------------------------- | ------------------------------ |
| **Unpaid Duties**      | Chores without point rewards | Homey's unique praised feature |
| **Paid Chores**        | Chores that earn points      | Flexibility                    |
| **Visual Distinction** | Clear UI difference          | Parent preference              |

### Progressive Unlocks

| Feature                    | Description               | Research Justification |
| -------------------------- | ------------------------- | ---------------------- |
| **Gradual Feature Reveal** | Unlock features over time | Combat reward fatigue  |
| **Day 7: Badges**          | Unlock badge collection   | Paced engagement       |
| **Day 14: Family Party**   | Unlock party system       | Build complexity       |
| **Day 30: Cosmetics**      | Unlock customization      | Long-term reward       |

### Subscription & Monetization

| Feature             | Description                               | Research Justification        |
| ------------------- | ----------------------------------------- | ----------------------------- |
| **Free Tier**       | Core chores, 2-3 kids, basic gamification | Demonstrate value             |
| **Premium Monthly** | $9.99/month                               | Premium positioning           |
| **Premium Annual**  | $59.99/year (50% savings)                 | Higher retention              |
| **7-Day Trial**     | Full premium access                       | 39.7% conversion              |
| **Lifetime Option** | $179.99 (limited)                         | Capture subscription-fatigued |

### Phase 12 Delivery Status (Current)

- [x] F12.1 Subscription tier system (Stripe + RevenueCat + grandfathered pricing)
- [x] F12.2 Premium feature gates (analytics/rewards/support/themes/history/API gating)
- [x] F12.3 In-app purchase store (catalog, bundles, receipts, refunds, parental controls, gift cards)
- [x] F12.4 Enterprise & school edition (district/school portal, classroom workflows, LMS controls, compliance/reporting)
- [ ] F12.5 API platform & integrations

---

## P3 - Nice to Have (Post-Launch)

### AI Features

| Feature                   | Description                        | Research Justification |
| ------------------------- | ---------------------------------- | ---------------------- |
| **AI Task Chunking**      | "Clean room" → 5-8 steps           | Goblin Tools pattern   |
| **AI Chore Suggestions**  | Recommend chores based on patterns | Personalization        |
| **AI Photo Verification** | Auto-verify completion photos      | ChoresAI concept       |

### Integrations

| Feature                  | Description               | Research Justification        |
| ------------------------ | ------------------------- | ----------------------------- |
| **Google Calendar Sync** | Push chores to calendar   | "Deal breaker" for some users |
| **Apple Calendar Sync**  | Push chores to calendar   | Platform parity               |
| **Smart Home**           | Appliance triggers chores | S'moresUp's GE/Bosch feature  |
| **Banking**              | Direct allowance deposits | Greenlight/BusyKid feature    |

### Social Features

| Feature                    | Description                     | Research Justification   |
| -------------------------- | ------------------------------- | ------------------------ |
| **Family Chat**            | Discuss chores in-app           | TimeTree praised feature |
| **Shareable Achievements** | Share badges on social          | Viral potential          |
| **Family Photo Album**     | Collection of completion photos | Memory keeping           |

### Advanced Scheduling

| Feature                | Description                  | Research Justification |
| ---------------------- | ---------------------------- | ---------------------- |
| **Rotation System**    | Auto-rotate assignments      | Fair distribution      |
| **Seasonal Templates** | Summer, school year, holiday | Contextual relevance   |
| **Chore Chains**       | Complete X before Y          | Complex workflows      |

### Gamification Expansion

| Feature                      | Description                   | Research Justification |
| ---------------------------- | ----------------------------- | ---------------------- |
| **Pet/Character Collection** | Earn creatures for chores     | Long-term engagement   |
| **Pet Evolution**            | Characters grow over time     | Emotional investment   |
| **Seasonal Events**          | Limited-time challenges       | Keep content fresh     |
| **Cosmetics Shop**           | Spend points on customization | Virtual economy        |

### Co-Parenting Features

| Feature                   | Description                 | Research Justification |
| ------------------------- | --------------------------- | ---------------------- |
| **Cross-Household Sync**  | Different settings per home | Largest untapped niche |
| **Unified Rewards**       | Points work in both homes   | Consistency for kids   |
| **Separate Parent Views** | Each parent sees their home | Privacy                |

### Localization

| Feature     | Description          | Research Justification |
| ----------- | -------------------- | ---------------------- |
| **Spanish** | Full app translation | Large US market        |
| **French**  | Full app translation | Canada, international  |
| **German**  | Full app translation | European expansion     |

### Voice Assistants

| Feature               | Description                  | Research Justification |
| --------------------- | ---------------------------- | ---------------------- |
| **Alexa Integration** | "Alexa, what are my chores?" | Cozi has this          |
| **Google Assistant**  | Voice chore queries          | Hands-free convenience |
| **Siri Shortcuts**    | Quick actions via Siri       | iOS integration        |

---

## Feature Dependencies

```
Authentication
    └── Household Management
        └── Member Management
            └── Chore Management
                ├── Completion Workflow
                │   └── Points System
                │       ├── Streak System
                │       │   └── Badges
                │       └── Rewards
                └── Scheduling
                    └── Notifications

Mobile App
    └── Offline Mode
        └── Sync Engine
            └── Conflict Resolution

Gamification
    ├── Points → Streaks → Badges
    ├── Family Party → Boss Battles
    └── Visual Progress
```

---

## Anti-Patterns to Avoid

| Anti-Pattern                | Why Avoid                           | Alternative                         |
| --------------------------- | ----------------------------------- | ----------------------------------- |
| **Punitive streak resets**  | Causes disengagement                | Forgiving algorithms, streak freeze |
| **Per-child pricing**       | Families with 4+ kids complain      | Per-household pricing               |
| **Mandatory signup first**  | Loses users before value            | Value-before-signup                 |
| **Feature bloat**           | S'moresUp criticized for complexity | Progressive unlocks                 |
| **Cutesy design for teens** | Teens reject it                     | Age-appropriate UI modes            |
| **Public leaderboards**     | Can cause toxic competition         | Collaborative framing               |
| **Trivial badges**          | "You signed up" = 0% impact         | Meaningful achievements             |
| **Surveillance aesthetics** | Teens disengage                     | Autonomy-respecting design          |

---

## Validation Metrics Per Feature

| Feature       | Success Metric             | Target |
| ------------- | -------------------------- | ------ |
| Streaks       | % users with 7+ day streak | >30%   |
| Badges        | % users earning 5+ badges  | >50%   |
| Photo Proof   | % chores with photos       | >20%   |
| Notifications | Opt-in rate                | >60%   |
| Offline Mode  | % sync success rate        | >99%   |
| Widgets       | % mobile users with widget | >40%   |
| Teen Mode     | Teen D30 retention         | >20%   |
| Rewards       | % users creating rewards   | >60%   |

---

**Document Version:** 1.0.0
**Next Review:** End of Phase 1
