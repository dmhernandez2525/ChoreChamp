# SDD-022: Advanced Automation & AI (Phase 17)

**Status:** Implemented
**Date:** 2026-02-15
**Phase:** 17
**Features:** F17.1-F17.5

---

## 1. Overview

Phase 17 introduces advanced automation and AI capabilities to ChoreChamp, enabling intelligent scheduling, AI-powered suggestions, configurable automation rules, predictive analytics, and natural language command processing. This phase consists of five integrated features:

- **F17.1 Smart Scheduling**: Algorithmic schedule optimization with conflict detection, resolution suggestions, and configurable strategies (balanced, efficiency, fairness, preference).
- **F17.2 AI Chore Suggestions**: AI-powered chore recommendations based on pattern analysis, seasonal factors, weather, household profiles, and member growth patterns.
- **F17.3 Automation Rules**: Configurable trigger-action automation with 7 trigger types, 7 action types, execution logging, and rule testing capabilities.
- **F17.4 Predictive Analytics**: Forecasting for chore completion rates, member engagement, workload, streak risks, and burnout risks with actionable insights.
- **F17.5 Natural Language Commands**: Process natural language input to manage chores, scheduling, reporting, members, and settings through conversational commands.

These features are unified through a SmartAutomation page with a 5-tab interface, shared API endpoints under the automation prefix, and coordinated database schema.

---

## 2. Architecture

### 2.1 Database Schema

All smart automation data is stored in `packages/database/src/schema/smart-automation.ts` with the following tables:

#### smartScheduleConfigs
Configuration for schedule optimization per household, including strategy selection and constraint flags.

#### scheduleOptimizations
Records of optimization runs with original/optimized scores, conflicts found, and suggestions generated.

#### aiChoreSuggestions
AI-generated chore suggestions with source attribution, confidence scores, priority levels, and acceptance tracking.

#### suggestionPreferences
Per-household preferences for AI suggestion behavior, including enabled sources and confidence thresholds.

#### automationRules
User-defined trigger-action rules with JSON-stored trigger conditions and action parameters, status tracking, and execution counts.

#### automationExecutionLogs
Execution history for automation rules, recording trigger data, actions executed, success/failure status, and processing duration.

#### predictions
Generated predictions with type classification, timeframe, confidence scores, and contributing factors.

#### predictiveInsights
Actionable insights derived from predictions, with severity levels and suggested actions.

#### predictiveAnalyticsConfigs
Per-household configuration for prediction types, notification preferences, and data retention.

#### naturalLanguageCommands
Command processing records with parsed intent, entities, category classification, confidence, and execution results.

### 2.2 API Routes

All endpoints are registered under `/:householdId/automation` in `apps/api/src/routes/smart-automation.ts`.

#### Smart Scheduling Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/schedule/config` | Get schedule configuration |
| PUT | `/schedule/config` | Update schedule configuration |
| POST | `/schedule/optimize` | Run schedule optimization |
| GET | `/schedule/conflicts` | Get schedule conflicts |
| POST | `/schedule/resolve-conflict` | Resolve a conflict |

#### AI Suggestion Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/suggestions` | List AI suggestions |
| POST | `/suggestions/:id/feedback` | Provide feedback |
| GET | `/suggestions/preferences` | Get preferences |
| PUT | `/suggestions/preferences` | Update preferences |
| POST | `/suggestions/generate` | Trigger generation |

#### Automation Rule Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/automation/rules` | List rules |
| POST | `/automation/rules` | Create a rule |
| GET | `/automation/rules/:id` | Get rule details |
| PUT | `/automation/rules/:id` | Update a rule |
| DELETE | `/automation/rules/:id` | Delete a rule |
| GET | `/automation/rules/:id/logs` | Get execution logs |
| POST | `/automation/rules/:id/test` | Test a rule |

#### Predictive Analytics Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/predictions` | Get predictions |
| GET | `/predictions/insights` | Get insights |
| PUT | `/predictions/insights/:id/read` | Mark insight read |
| GET | `/predictions/config` | Get config |
| PUT | `/predictions/config` | Update config |
| POST | `/predictions/generate` | Trigger generation |

#### Natural Language Command Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/commands` | Execute a command |
| GET | `/commands/history` | Get command history |
| GET | `/commands/capabilities` | Get capabilities |

### 2.3 Frontend Components

The `SmartAutomation` page (`apps/web/src/pages/SmartAutomation.tsx`) provides a 5-tab interface:

1. **Schedule** - Strategy selection, optimization runner, conflict viewer
2. **AI Tips** - Suggestion cards, source filters, preference management
3. **Rules** - Automation rule builder, trigger type tags, execution stats
4. **Predict** - Prediction type filters, insight cards, config panel
5. **Commands** - Natural language input with example commands and history

### 2.4 API Client Integration

The `ApiClient` class includes ~25 methods for automation features, with corresponding React Query hooks in `packages/api-client/src/hooks/index.ts`.

---

## 3. Type Definitions

All types are defined in `packages/types/src/smart-automation.ts`:

- **ScheduleOptimizationStrategy**: `'balanced' | 'efficiency' | 'fairness' | 'preference'`
- **SmartScheduleConflictType**: `'overlap' | 'overload' | 'availability' | 'preference'`
- **SuggestionSource**: `'pattern_analysis' | 'seasonal' | 'weather' | 'household_profile' | 'member_growth'`
- **SuggestionPriority**: `'low' | 'medium' | 'high' | 'urgent'`
- **SmartAutomationTriggerType**: 7 trigger types (chore_completed, chore_overdue, streak_reached, etc.)
- **SmartAutomationActionType**: 7 action types (assign_chore, send_notification, award_bonus_points, etc.)
- **AutomationStatus**: `'active' | 'paused' | 'disabled'`
- **PredictionType**: 5 types (chore_completion, member_engagement, workload_forecast, streak_risk, burnout_risk)
- **PredictionTimeframe**: `'daily' | 'weekly' | 'monthly'`
- **CommandCategory**: 5 categories (chore_management, scheduling, reporting, member_management, settings)
- **CommandStatus**: `'pending' | 'processing' | 'completed' | 'failed'`

Note: Some types were prefixed with `Smart` to avoid name collisions with existing types in other modules (e.g., `SmartScheduleConflict`, `SmartAutomationTrigger`, `SmartAutomationAction`).

---

## 4. Testing

Tests are located at `apps/web/src/pages/SmartAutomation.test.ts` with 42 test cases covering:

- Schedule optimization strategy validation (2 tests)
- Schedule conflict type validation (2 tests)
- Smart schedule config validation (2 tests)
- Schedule optimization result validation (2 tests)
- Suggestion source validation (2 tests)
- Suggestion priority validation (2 tests)
- Suggestion confidence validation (2 tests)
- Suggestion preferences validation (1 test)
- Automation trigger type validation (2 tests)
- Automation action type validation (2 tests)
- Automation status validation and transitions (2 tests)
- Automation rule request validation (2 tests)
- Prediction type validation (2 tests)
- Prediction timeframe validation (2 tests)
- Predictive insight severity validation (2 tests)
- Prediction factor validation (2 tests)
- Predictive analytics config validation (1 test)
- Command category validation (2 tests)
- Command status validation and transitions (2 tests)
- Command input validation (2 tests)
- Edge cases (4 tests)

---

## 5. Navigation

The Smart Automation page is accessible from:
- Mobile bottom nav menu (Sparkles icon, labeled "Automation")
- Route: `/households/:householdId/automation`
