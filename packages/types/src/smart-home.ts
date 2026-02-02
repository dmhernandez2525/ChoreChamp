// Smart Home Hub Integration Types (F10.1)

export type SmartHomePlatform =
  | 'home_assistant'
  | 'smartthings'
  | 'google_home'
  | 'amazon_alexa'
  | 'apple_homekit'
  | 'hubitat'
  | 'generic_mqtt'
  | 'custom_webhook';

export type DeviceCategory =
  | 'light'
  | 'switch'
  | 'sensor'
  | 'thermostat'
  | 'lock'
  | 'camera'
  | 'vacuum'
  | 'appliance'
  | 'media_player'
  | 'other';

export type DeviceCapability =
  | 'on_off'
  | 'brightness'
  | 'color'
  | 'temperature'
  | 'humidity'
  | 'motion'
  | 'contact'
  | 'lock_unlock'
  | 'battery'
  | 'energy'
  | 'vacuum_control'
  | 'media_control';

export type AutomationTriggerType =
  | 'chore_completed'
  | 'chore_assigned'
  | 'streak_milestone'
  | 'level_up'
  | 'badge_earned'
  | 'points_threshold'
  | 'time_schedule'
  | 'device_state_change';

export type AutomationActionType =
  | 'device_control'
  | 'notification'
  | 'create_chore'
  | 'award_bonus'
  | 'webhook'
  | 'delay';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

// Smart Home Hub connection
export interface SmartHomeHub {
  id: string;
  householdId: string;
  platform: SmartHomePlatform;
  name: string;
  description: string | null;
  hostUrl: string | null;
  status: ConnectionStatus;
  lastConnectedAt: Date | null;
  lastError: string | null;
  capabilities: string[];
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Platform-specific configuration
export interface HubConfiguration {
  platform: SmartHomePlatform;
  hostUrl?: string;
  accessToken?: string;
  apiKey?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  mqttBroker?: string;
  mqttTopic?: string;
  customConfig?: Record<string, unknown>;
}

// Connected smart device
export interface SmartDevice {
  id: string;
  hubId: string;
  householdId: string;
  externalId: string;  // ID in the external system
  name: string;
  category: DeviceCategory;
  manufacturer: string | null;
  model: string | null;
  location: string | null;  // Room/area name
  capabilities: DeviceCapability[];
  currentState: DeviceState;
  isOnline: boolean;
  lastSeenAt: Date | null;
  choreRelatedZone: string | null;  // Links device to chore zone
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Device state snapshot
export interface DeviceState {
  power?: 'on' | 'off';
  brightness?: number;  // 0-100
  color?: { h: number; s: number; v: number };
  temperature?: number;
  humidity?: number;
  motion?: boolean;
  contact?: 'open' | 'closed';
  locked?: boolean;
  battery?: number;  // 0-100
  energyUsage?: number;  // watts
  vacuumState?: 'cleaning' | 'idle' | 'charging' | 'error';
  mediaState?: 'playing' | 'paused' | 'stopped';
  lastUpdated: Date;
}

// Device command
export interface DeviceCommand {
  type: 'set_power' | 'set_brightness' | 'set_color' | 'set_temperature' | 'lock' | 'vacuum_start' | 'vacuum_stop' | 'custom';
  parameters: Record<string, unknown>;
}

// Automation rule
export interface SmartHomeAutomation {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  lastTriggeredAt: Date | null;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Trigger definition
export interface AutomationTrigger {
  type: AutomationTriggerType;
  config: TriggerConfig;
}

export type TriggerConfig =
  | ChoreCompletedTrigger
  | ChoreAssignedTrigger
  | StreakMilestoneTrigger
  | LevelUpTrigger
  | BadgeEarnedTrigger
  | PointsThresholdTrigger
  | TimeScheduleTrigger
  | DeviceStateChangeTrigger;

export interface ChoreCompletedTrigger {
  type: 'chore_completed';
  choreIds?: string[];  // Specific chores or empty for all
  memberId?: string;    // Specific member or empty for all
  category?: string;    // Chore category
  zone?: string;        // Room/zone
}

export interface ChoreAssignedTrigger {
  type: 'chore_assigned';
  memberId?: string;
  category?: string;
}

export interface StreakMilestoneTrigger {
  type: 'streak_milestone';
  streakDays: number;
  memberId?: string;
}

export interface LevelUpTrigger {
  type: 'level_up';
  targetLevel?: number;  // Specific level or any level up
  memberId?: string;
}

export interface BadgeEarnedTrigger {
  type: 'badge_earned';
  badgeIds?: string[];
  memberId?: string;
}

export interface PointsThresholdTrigger {
  type: 'points_threshold';
  threshold: number;
  memberId?: string;
}

export interface TimeScheduleTrigger {
  type: 'time_schedule';
  cron: string;  // Cron expression
  timezone: string;
}

export interface DeviceStateChangeTrigger {
  type: 'device_state_change';
  deviceId: string;
  property: string;
  fromValue?: unknown;
  toValue?: unknown;
}

// Condition definition
export interface AutomationCondition {
  type: 'time_range' | 'day_of_week' | 'member_level' | 'device_state' | 'custom';
  config: Record<string, unknown>;
  operator: 'and' | 'or';
}

// Action definition
export interface AutomationAction {
  type: AutomationActionType;
  config: ActionConfig;
  delay?: number;  // ms delay before executing
}

export type ActionConfig =
  | DeviceControlAction
  | NotificationAction
  | CreateChoreAction
  | AwardBonusAction
  | WebhookAction
  | DelayAction;

export interface DeviceControlAction {
  type: 'device_control';
  deviceId: string;
  command: DeviceCommand;
}

export interface NotificationAction {
  type: 'notification';
  title: string;
  message: string;
  memberIds?: string[];  // Specific members or all
}

export interface CreateChoreAction {
  type: 'create_chore';
  choreTemplateId: string;
  assigneeId?: string;
  dueInHours?: number;
}

export interface AwardBonusAction {
  type: 'award_bonus';
  pointsAmount: number;
  xpAmount?: number;
  memberId?: string;  // Specific or triggering member
  reason: string;
}

export interface WebhookAction {
  type: 'webhook';
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface DelayAction {
  type: 'delay';
  durationMs: number;
}

// Automation execution log
export interface AutomationLog {
  id: string;
  automationId: string;
  householdId: string;
  triggeredAt: Date;
  triggerData: Record<string, unknown>;
  actionsExecuted: ActionExecutionResult[];
  status: 'success' | 'partial' | 'failed';
  errorMessage: string | null;
}

export interface ActionExecutionResult {
  actionIndex: number;
  actionType: AutomationActionType;
  status: 'success' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
  executedAt: Date;
}

// Chore zone mapping to devices
export interface ChoreZoneDevice {
  id: string;
  householdId: string;
  zoneName: string;  // e.g., "Kitchen", "Bathroom", "Living Room"
  deviceIds: string[];
  choreCategories: string[];  // Categories that relate to this zone
  isActive: boolean;
}

// Device activity for chore verification
export interface DeviceActivity {
  id: string;
  deviceId: string;
  householdId: string;
  activityType: 'state_change' | 'usage' | 'motion' | 'energy_spike';
  previousState: DeviceState;
  newState: DeviceState;
  detectedAt: Date;
  duration?: number;  // ms
  choreId?: string;  // Linked chore if detected
}

// API Request/Response types
export interface ConnectHubRequest {
  platform: SmartHomePlatform;
  name: string;
  description?: string;
  configuration: HubConfiguration;
}

export interface ConnectHubResponse {
  hub: SmartHomeHub;
  devices: SmartDevice[];
}

export interface SyncDevicesRequest {
  hubId: string;
}

export interface SyncDevicesResponse {
  devicesAdded: SmartDevice[];
  devicesUpdated: SmartDevice[];
  devicesRemoved: string[];
}

export interface ControlDeviceRequest {
  deviceId: string;
  command: DeviceCommand;
}

export interface ControlDeviceResponse {
  success: boolean;
  device: SmartDevice;
  previousState: DeviceState;
  newState: DeviceState;
  error?: string;
}

export interface CreateAutomationRequest {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
}

export interface UpdateAutomationRequest {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  trigger?: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
}

export interface TestAutomationRequest {
  automationId: string;
  mockTriggerData?: Record<string, unknown>;
}

export interface TestAutomationResponse {
  wouldTrigger: boolean;
  conditionsResult: Array<{
    condition: AutomationCondition;
    passed: boolean;
    reason?: string;
  }>;
  actionsPreview: Array<{
    action: AutomationAction;
    description: string;
  }>;
}

// Dashboard/Overview types
export interface SmartHomeOverview {
  hubs: SmartHomeHub[];
  totalDevices: number;
  onlineDevices: number;
  activeAutomations: number;
  recentActivity: DeviceActivity[];
  choreRelatedDevices: number;
}

export interface DevicesByZone {
  zoneName: string;
  devices: SmartDevice[];
  relatedChores: string[];
}
