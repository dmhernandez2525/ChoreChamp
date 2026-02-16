// Phase 17: Advanced Automation & AI (F17.1-F17.5)

// F17.1 Smart Scheduling
export type ScheduleOptimizationStrategy = 'balanced' | 'efficiency' | 'fairness' | 'preference';

export type SmartScheduleConflictType = 'overlap' | 'overload' | 'availability' | 'preference';

export interface SmartScheduleConfig {
  id: string;
  householdId: string;
  strategy: ScheduleOptimizationStrategy;
  maxChoresPerMemberPerDay: number;
  respectAvailability: boolean;
  balanceWorkload: boolean;
  considerPreferences: boolean;
  avoidBackToBack: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSmartScheduleConfigRequest {
  strategy: ScheduleOptimizationStrategy;
  maxChoresPerMemberPerDay: number;
  respectAvailability: boolean;
  balanceWorkload: boolean;
  considerPreferences: boolean;
  avoidBackToBack: boolean;
}

export interface UpdateSmartScheduleConfigRequest {
  strategy?: ScheduleOptimizationStrategy;
  maxChoresPerMemberPerDay?: number;
  respectAvailability?: boolean;
  balanceWorkload?: boolean;
  considerPreferences?: boolean;
  avoidBackToBack?: boolean;
}

export interface SmartScheduleConflict {
  id: string;
  type: SmartScheduleConflictType;
  memberId: string;
  choreId: string;
  conflictingChoreId: string | null;
  date: string;
  description: string;
  suggestedResolution: string;
}

export interface ScheduleOptimizationResult {
  id: string;
  householdId: string;
  strategy: ScheduleOptimizationStrategy;
  originalScore: number;
  optimizedScore: number;
  improvementPercent: number;
  conflicts: SmartScheduleConflict[];
  suggestions: SmartScheduleSuggestion[];
  generatedAt: string;
}

export interface SmartScheduleSuggestion {
  choreId: string;
  currentMemberId: string;
  suggestedMemberId: string;
  currentTime: string | null;
  suggestedTime: string;
  reason: string;
  impactScore: number;
}

// F17.2 AI Chore Suggestions
export type SuggestionSource = 'pattern_analysis' | 'seasonal' | 'weather' | 'household_profile' | 'member_growth';

export type SuggestionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AIChoreSuggestion {
  id: string;
  householdId: string;
  title: string;
  description: string;
  source: SuggestionSource;
  priority: SuggestionPriority;
  suggestedMemberId: string | null;
  suggestedFrequency: string | null;
  suggestedPoints: number;
  confidence: number;
  reasoning: string;
  isAccepted: boolean | null;
  dismissedAt: string | null;
  createdAt: string;
}

export interface SuggestionFeedback {
  suggestionId: string;
  accepted: boolean;
  reason?: string;
}

export interface SuggestionPreferences {
  id: string;
  householdId: string;
  enableSuggestions: boolean;
  sources: SuggestionSource[];
  maxSuggestionsPerWeek: number;
  minConfidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSuggestionPreferencesRequest {
  enableSuggestions?: boolean;
  sources?: SuggestionSource[];
  maxSuggestionsPerWeek?: number;
  minConfidence?: number;
}

// F17.3 Automation Rules
export type SmartAutomationTriggerType =
  | 'chore_completed'
  | 'chore_overdue'
  | 'streak_reached'
  | 'points_threshold'
  | 'time_based'
  | 'weather_change'
  | 'member_available';

export type SmartAutomationActionType =
  | 'assign_chore'
  | 'send_notification'
  | 'award_bonus_points'
  | 'create_chore'
  | 'update_schedule'
  | 'trigger_celebration'
  | 'adjust_difficulty';

export type AutomationStatus = 'active' | 'paused' | 'disabled';

export interface SmartAutomationTrigger {
  type: SmartAutomationTriggerType;
  conditions: Record<string, unknown>;
}

export interface SmartAutomationAction {
  type: SmartAutomationActionType;
  parameters: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  trigger: SmartAutomationTrigger;
  actions: SmartAutomationAction[];
  status: AutomationStatus;
  executionCount: number;
  lastExecutedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationRuleRequest {
  name: string;
  description?: string;
  trigger: SmartAutomationTrigger;
  actions: SmartAutomationAction[];
}

export interface UpdateAutomationRuleRequest {
  name?: string;
  description?: string;
  trigger?: SmartAutomationTrigger;
  actions?: SmartAutomationAction[];
  status?: AutomationStatus;
}

export interface AutomationExecutionLog {
  id: string;
  ruleId: string;
  triggeredAt: string;
  triggerData: Record<string, unknown>;
  actionsExecuted: Array<{
    actionType: SmartAutomationActionType;
    success: boolean;
    result: Record<string, unknown>;
    error?: string;
  }>;
  success: boolean;
  duration: number;
}

// F17.4 Predictive Analytics
export type PredictionType =
  | 'chore_completion'
  | 'member_engagement'
  | 'workload_forecast'
  | 'streak_risk'
  | 'burnout_risk';

export type PredictionTimeframe = 'daily' | 'weekly' | 'monthly';

export interface Prediction {
  id: string;
  householdId: string;
  type: PredictionType;
  timeframe: PredictionTimeframe;
  memberId: string | null;
  prediction: Record<string, unknown>;
  confidence: number;
  factors: PredictionFactor[];
  generatedAt: string;
  expiresAt: string;
}

export interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface PredictiveInsight {
  id: string;
  householdId: string;
  title: string;
  description: string;
  category: PredictionType;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  suggestedAction: string | null;
  memberId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PredictiveAnalyticsConfig {
  id: string;
  householdId: string;
  enablePredictions: boolean;
  enabledTypes: PredictionType[];
  notifyOnCritical: boolean;
  dataRetentionDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePredictiveAnalyticsConfigRequest {
  enablePredictions?: boolean;
  enabledTypes?: PredictionType[];
  notifyOnCritical?: boolean;
  dataRetentionDays?: number;
}

// F17.5 Natural Language Commands
export type CommandCategory = 'chore_management' | 'scheduling' | 'reporting' | 'member_management' | 'settings';

export type CommandStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface NaturalLanguageCommand {
  id: string;
  householdId: string;
  memberId: string;
  input: string;
  parsedIntent: string;
  parsedEntities: Record<string, unknown>;
  category: CommandCategory;
  status: CommandStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  confidence: number;
  processingTime: number;
  createdAt: string;
}

export interface CommandRequest {
  input: string;
}

export interface CommandResponse {
  id: string;
  status: CommandStatus;
  message: string;
  result: Record<string, unknown> | null;
  suggestions: string[];
  confidence: number;
}

export interface CommandHistory {
  commands: NaturalLanguageCommand[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CommandCapability {
  category: CommandCategory;
  examples: string[];
  description: string;
}
