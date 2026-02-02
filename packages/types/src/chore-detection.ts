// Chore Detection Types for F10.2 - Automated Chore Detection

/**
 * Types of sensors that can detect chore-related activity
 */
export type DetectionSensorType =
  | 'motion' // Motion sensors
  | 'contact' // Door/window sensors
  | 'humidity' // Humidity sensors
  | 'temperature' // Temperature sensors
  | 'air_quality' // Air quality/dust sensors
  | 'water_leak' // Water/moisture sensors
  | 'vibration' // Vibration sensors
  | 'light' // Light level sensors
  | 'sound' // Sound/noise sensors
  | 'occupancy' // Occupancy sensors
  | 'vacuum_state' // Robot vacuum state
  | 'appliance_state' // Appliance on/off state
  | 'power_consumption' // Power usage sensors
  | 'camera_ai'; // AI camera detection

/**
 * Types of chores that can be auto-detected
 */
export type DetectableChoreType =
  | 'vacuuming'
  | 'mopping'
  | 'dusting'
  | 'dishes'
  | 'laundry'
  | 'trash_out'
  | 'bed_making'
  | 'room_tidying'
  | 'bathroom_cleaning'
  | 'kitchen_cleaning'
  | 'pet_feeding'
  | 'plant_watering'
  | 'window_cleaning'
  | 'floor_sweeping'
  | 'surface_wiping'
  | 'custom';

/**
 * Condition operators for detection rules
 */
export type DetectionConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'contains'
  | 'changed_to'
  | 'changed_from'
  | 'changed'
  | 'stayed_for'; // Value stayed for X duration

/**
 * Detection rule condition
 */
export interface DetectionCondition {
  sensorAttribute: string; // e.g., 'power', 'state', 'humidity'
  operator: DetectionConditionOperator;
  value: string | number | boolean;
  duration?: number; // Duration in seconds for 'stayed_for' operator
}

/**
 * Detection rule for a specific device/sensor
 */
export interface DetectionRule {
  id: string;
  householdId: string;
  name: string;
  description: string | null;
  isEnabled: boolean;

  // Sensor configuration
  deviceId: string; // Smart device ID
  sensorType: DetectionSensorType;
  conditions: DetectionCondition[];
  conditionLogic: 'all' | 'any'; // AND or OR

  // Chore configuration
  choreType: DetectableChoreType;
  linkedChoreId: string | null; // Link to specific chore template
  zoneName: string | null; // Zone this detection applies to

  // Detection behavior
  detectionMode: 'completion' | 'needed' | 'both';
  // completion: Auto-mark chore as done
  // needed: Suggest chore needs to be done
  // both: Both detection types

  // Completion detection settings
  completionConfidence: number; // 0-100 confidence threshold
  requireManualConfirm: boolean; // Require user confirmation
  cooldownMinutes: number; // Minimum time between detections

  // Need detection settings
  needThreshold: number | null; // Threshold value for "needs cleaning"
  needCheckInterval: number | null; // How often to check (minutes)

  // Rewards
  bonusPointsOnAutoDetect: number; // Bonus for auto-detected completion

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Detection event log
 */
export interface DetectionEvent {
  id: string;
  ruleId: string;
  householdId: string;
  deviceId: string;

  eventType: 'completion_detected' | 'need_detected' | 'false_positive';
  choreType: DetectableChoreType;
  zoneName: string | null;

  // Sensor data at time of detection
  sensorData: Record<string, unknown>;
  confidence: number; // Detection confidence 0-100

  // Outcome
  wasConfirmed: boolean | null; // null if pending
  confirmedBy: string | null; // Member ID who confirmed
  linkedChoreCompletionId: string | null; // If auto-completed a chore

  // Points awarded
  pointsAwarded: number;

  createdAt: Date;
  processedAt: Date | null;
}

/**
 * Cleanliness metric for a zone
 */
export interface CleanlinessMetric {
  id: string;
  householdId: string;
  zoneName: string;

  // Current metrics
  overallScore: number; // 0-100
  dustLevel: number | null; // 0-100 (from air quality sensor)
  humidityLevel: number | null; // Percentage
  lastMotionAt: Date | null;
  lastCleanedAt: Date | null;

  // Calculated needs
  suggestedChores: {
    choreType: DetectableChoreType;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
  }[];

  updatedAt: Date;
}

/**
 * Sensor reading for historical tracking
 */
export interface SensorReading {
  id: string;
  deviceId: string;
  householdId: string;

  sensorType: DetectionSensorType;
  attribute: string;
  value: number | string | boolean;
  unit: string | null;

  recordedAt: Date;
}

/**
 * Detection pattern learned over time
 */
export interface DetectionPattern {
  id: string;
  householdId: string;
  choreType: DetectableChoreType;
  zoneName: string;

  // Learned patterns
  typicalDuration: number; // Average duration in seconds
  typicalTimeOfDay: string | null; // e.g., "morning", "evening"
  typicalDayOfWeek: number[] | null; // Days when typically done
  typicalMemberId: string | null; // Who usually does this

  // Detection accuracy
  totalDetections: number;
  confirmedDetections: number;
  falsePositives: number;
  accuracyRate: number; // Percentage

  // Sensor signatures
  sensorSignatures: {
    deviceId: string;
    attribute: string;
    expectedPattern: string; // Description of pattern
    weight: number; // How important this signal is
  }[];

  updatedAt: Date;
}

/**
 * Create detection rule input
 */
export interface CreateDetectionRuleInput {
  name: string;
  description?: string;
  deviceId: string;
  sensorType: DetectionSensorType;
  conditions: DetectionCondition[];
  conditionLogic?: 'all' | 'any';
  choreType: DetectableChoreType;
  linkedChoreId?: string;
  zoneName?: string;
  detectionMode: 'completion' | 'needed' | 'both';
  completionConfidence?: number;
  requireManualConfirm?: boolean;
  cooldownMinutes?: number;
  needThreshold?: number;
  needCheckInterval?: number;
  bonusPointsOnAutoDetect?: number;
}

/**
 * Update detection rule input
 */
export interface UpdateDetectionRuleInput {
  name?: string;
  description?: string | null;
  isEnabled?: boolean;
  conditions?: DetectionCondition[];
  conditionLogic?: 'all' | 'any';
  linkedChoreId?: string | null;
  zoneName?: string | null;
  detectionMode?: 'completion' | 'needed' | 'both';
  completionConfidence?: number;
  requireManualConfirm?: boolean;
  cooldownMinutes?: number;
  needThreshold?: number | null;
  needCheckInterval?: number | null;
  bonusPointsOnAutoDetect?: number;
}

/**
 * Detection event confirmation input
 */
export interface ConfirmDetectionInput {
  wasAccurate: boolean;
  feedbackNote?: string;
}

/**
 * Detection analytics
 */
export interface DetectionAnalytics {
  totalDetections: number;
  confirmedCompletions: number;
  suggestedNeeds: number;
  falsePositives: number;
  accuracyRate: number;
  totalBonusPointsAwarded: number;

  byChoreType: {
    choreType: DetectableChoreType;
    detections: number;
    accuracy: number;
  }[];

  byZone: {
    zoneName: string;
    cleanlinessScore: number;
    detections: number;
  }[];

  recentDetections: DetectionEvent[];
}

/**
 * Sensor template for common detection setups
 */
export interface DetectionTemplate {
  id: string;
  name: string;
  description: string;
  choreType: DetectableChoreType;
  sensorType: DetectionSensorType;
  conditions: DetectionCondition[];
  conditionLogic: 'all' | 'any';
  detectionMode: 'completion' | 'needed' | 'both';
  recommendedConfidence: number;
  recommendedCooldown: number;
}

/**
 * Predefined detection templates
 */
export const DETECTION_TEMPLATES: DetectionTemplate[] = [
  {
    id: 'vacuum-robot-completion',
    name: 'Robot Vacuum Completion',
    description: 'Detect when robot vacuum finishes cleaning',
    choreType: 'vacuuming',
    sensorType: 'vacuum_state',
    conditions: [
      { sensorAttribute: 'vacuumState', operator: 'changed_to', value: 'idle' },
    ],
    conditionLogic: 'all',
    detectionMode: 'completion',
    recommendedConfidence: 90,
    recommendedCooldown: 60,
  },
  {
    id: 'dishwasher-completion',
    name: 'Dishwasher Cycle Complete',
    description: 'Detect when dishwasher finishes running',
    choreType: 'dishes',
    sensorType: 'appliance_state',
    conditions: [
      { sensorAttribute: 'power', operator: 'less_than', value: 5 },
      { sensorAttribute: 'power', operator: 'changed_from', value: 'running' },
    ],
    conditionLogic: 'all',
    detectionMode: 'completion',
    recommendedConfidence: 85,
    recommendedCooldown: 120,
  },
  {
    id: 'laundry-washer-completion',
    name: 'Washing Machine Complete',
    description: 'Detect when washing machine finishes',
    choreType: 'laundry',
    sensorType: 'appliance_state',
    conditions: [
      { sensorAttribute: 'power', operator: 'less_than', value: 3 },
    ],
    conditionLogic: 'all',
    detectionMode: 'completion',
    recommendedConfidence: 80,
    recommendedCooldown: 30,
  },
  {
    id: 'trash-motion-detection',
    name: 'Trash Taken Out',
    description: 'Detect trash can area activity with door sensor',
    choreType: 'trash_out',
    sensorType: 'contact',
    conditions: [
      { sensorAttribute: 'contact', operator: 'changed_to', value: 'open' },
    ],
    conditionLogic: 'all',
    detectionMode: 'completion',
    recommendedConfidence: 70,
    recommendedCooldown: 720, // 12 hours
  },
  {
    id: 'dust-level-high',
    name: 'Dusting Needed',
    description: 'Detect when air quality indicates dusting is needed',
    choreType: 'dusting',
    sensorType: 'air_quality',
    conditions: [
      { sensorAttribute: 'pm25', operator: 'greater_than', value: 35 },
      { sensorAttribute: 'pm25', operator: 'stayed_for', value: 35, duration: 3600 },
    ],
    conditionLogic: 'all',
    detectionMode: 'needed',
    recommendedConfidence: 75,
    recommendedCooldown: 1440, // 24 hours
  },
  {
    id: 'bathroom-humidity-high',
    name: 'Bathroom Needs Ventilation/Cleaning',
    description: 'Detect sustained high humidity in bathroom',
    choreType: 'bathroom_cleaning',
    sensorType: 'humidity',
    conditions: [
      { sensorAttribute: 'humidity', operator: 'greater_than', value: 70 },
      { sensorAttribute: 'humidity', operator: 'stayed_for', value: 70, duration: 7200 },
    ],
    conditionLogic: 'all',
    detectionMode: 'needed',
    recommendedConfidence: 65,
    recommendedCooldown: 1440,
  },
];
