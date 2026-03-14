// Chore types

export type Difficulty = 'easy' | 'medium' | 'hard';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'monthly' | 'after_completion' | 'custom';
export type AssignmentType = 'specific' | 'anyone' | 'rotation';
export type CompletionStatus = 'pending' | 'approved' | 'rejected';
export type ChorePriority = 'low' | 'medium' | 'high' | 'urgent';
export type ChoreViewMode = 'kanban' | 'calendar' | 'list' | 'dashboard';
export type ChoreActivityAction = 'created' | 'status_changed' | 'assigned' | 'unassigned' | 'edited' | 'commented' | 'attachment_added';
export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'in' | 'not_in' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'is_true' | 'is_false' | 'before' | 'after' | 'is_overdue' | 'is_today' | 'is_this_week';
export type FilterVisibility = 'private' | 'household';

export type ChoreCategory =
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'living_room'
  | 'outdoor'
  | 'pet_care'
  | 'laundry'
  | 'general';

export interface Chore {
  id: string;
  householdId: string;

  title: string;
  description: string | null;
  icon: string;
  category: ChoreCategory;

  // Points
  pointValue: number;
  difficulty: Difficulty;

  // Assignment
  assignedTo: string[];
  assignmentType: AssignmentType;
  rotationIndex: number;

  // Scheduling
  recurrenceType: RecurrenceType;
  recurrenceDays: number[] | null; // 0-6 for days of week
  recurrenceInterval: number | null;
  recurrenceAfterDays: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  dueTime: string | null; // HH:MM
  timeWindowMinutes: number | null;

  // Requirements
  requiresApproval: boolean;
  requiresPhoto: boolean;
  estimatedMinutes: number | null;

  // Board view
  priority: ChorePriority;
  boardOrder: number;

  // ADHD settings
  showTimer: boolean;
  steps: string[] | null;

  // Metadata
  createdBy: string;
  isActive: boolean;
  templateId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface ChoreTemplate {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: ChoreCategory;
  pointValue: number;
  difficulty: Difficulty;
  estimatedMinutes: number | null;
  minAge: number | null;
  maxAge: number | null;
  steps: string[] | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ChoreCompletion {
  id: string;
  choreId: string;
  householdId: string;
  memberId: string;

  scheduledDate: string; // YYYY-MM-DD
  completedAt: Date;

  status: CompletionStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;

  photoUrl: string | null;

  pointsAwarded: number;
  streakDay: number | null;

  // Time tracking
  startedAt: Date | null;
  durationSeconds: number | null;

  createdAt: Date;
}

export interface ChoreSchedule {
  id: string;
  choreId: string;
  householdId: string;
  scheduledDate: string;
  assignedTo: string;
  isCompleted: boolean;
  completionId: string | null;
  createdAt: Date;
}

// API Request/Response types
export interface CreateChoreRequest {
  title: string;
  description?: string;
  icon?: string;
  category?: ChoreCategory;
  pointValue?: number;
  difficulty?: Difficulty;
  assignedTo?: string[];
  assignmentType?: AssignmentType;
  recurrenceType?: RecurrenceType;
  recurrenceDays?: number[];
  recurrenceInterval?: number;
  recurrenceAfterDays?: number;
  startDate?: string;
  endDate?: string;
  dueTime?: string;
  timeWindowMinutes?: number;
  requiresApproval?: boolean;
  requiresPhoto?: boolean;
  estimatedMinutes?: number;
  showTimer?: boolean;
  steps?: string[];
  priority?: ChorePriority;
}

export interface CompleteChoreRequest {
  scheduledDate?: string;
  photoUrl?: string;
  startedAt?: Date;
  durationSeconds?: number;
}

export interface TodayChore extends ChoreSchedule {
  chore: Chore;
  completion: ChoreCompletion | null;
}

export interface ChoreWithCompletions extends Chore {
  completions: ChoreCompletion[];
}

// Task Management View types (Phase 15)

export interface ChoreComment {
  id: string;
  choreId: string;
  memberId: string;
  comment: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChoreAttachment {
  id: string;
  choreId: string;
  memberId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string | null;
  isPhotoProof: boolean;
  createdAt: Date;
}

export interface ChoreActivityEntry {
  id: string;
  choreId: string;
  memberId: string;
  action: ChoreActivityAction;
  oldValue: unknown;
  newValue: unknown;
  createdAt: Date;
}

export interface ChoreFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface SavedFilterView {
  id: string;
  householdId: string;
  memberId: string;
  name: string;
  filters: ChoreFilter[];
  sort: { field: string; direction: 'asc' | 'desc' };
  groupBy: string | null;
  visibility: FilterVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardPreferences {
  id: string;
  householdId: string;
  memberId: string;
  viewMode: ChoreViewMode;
  columnSettings: Record<string, { color?: string; wipLimit?: number; hidden?: boolean; order?: number }>;
  defaultGroupBy: string | null;
  defaultSort: { field: string; direction: 'asc' | 'desc' };
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkAction {
  action: 'assign' | 'change_status' | 'change_category' | 'change_priority' | 'reschedule' | 'delete';
  choreIds: string[];
  payload: Record<string, unknown>;
}

export interface ChoreAutomationRule {
  id: string;
  householdId: string;
  name: string;
  triggerType: 'chore_completed' | 'chore_overdue' | 'status_changed' | 'time_based' | 'member_joined';
  triggerConfig: Record<string, unknown>;
  conditions: Array<{ field: string; operator: string; value: unknown }>;
  actions: Array<{ type: string; config: Record<string, unknown> }>;
  enabled: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UndoableAction {
  type: string;
  description: string;
  undoFn: () => Promise<void>;
  redoFn: () => Promise<void>;
}

// API request types for task management

export interface BulkUpdateRequest {
  choreIds: string[];
  changes: Partial<Pick<Chore, 'assignedTo' | 'category' | 'priority' | 'startDate' | 'dueTime'>>;
  status?: string;
  dueDate?: string;
}

export interface BulkReorderRequest {
  updates: Array<{ choreId: string; boardOrder: number; status?: string }>;
}

export interface AddCommentRequest {
  comment: string;
}

export interface RescheduleRequest {
  newDate: string;
}

export interface CreateSavedFilterRequest {
  name: string;
  filters: ChoreFilter[];
  sort?: { field: string; direction: 'asc' | 'desc' };
  groupBy?: string;
  visibility?: FilterVisibility;
}

// Tags
export interface Tag {
  id: string;
  householdId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ChoreTag {
  id: string;
  choreId: string;
  tagId: string;
  createdAt: Date;
}

export interface CreateTagRequest {
  name: string;
  color: string;
}

export interface AddChoreTagRequest {
  tagId: string;
}

// Time tracking
export interface TimeLog {
  id: string;
  choreId: string;
  memberId: string;
  startedAt: Date;
  stoppedAt: Date | null;
  durationSeconds: number | null;
  createdAt: Date;
}

export interface StartTimeTrackingRequest {
  choreId: string;
}

// Dependencies
export type DependencyType = 'blocks' | 'blocked_by' | 'relates_to';

export interface ChoreDependency {
  id: string;
  choreId: string;
  dependsOnChoreId: string;
  type: DependencyType;
  createdAt: Date;
}

export interface AddDependencyRequest {
  dependsOnChoreId: string;
  type: DependencyType;
}

// Calendar view types
export interface CalendarChoreView {
  date: string;
  chores: Array<Chore & {
    scheduledDate: string;
    assignedMemberName?: string;
    isCompleted: boolean;
    completionId: string | null;
  }>;
}

// Update saved filter request
export interface UpdateSavedFilterRequest {
  name?: string;
  filters?: ChoreFilter[];
  sort?: { field: string; direction: 'asc' | 'desc' };
  groupBy?: string | null;
  visibility?: FilterVisibility;
}

// Add attachment request
export interface AddAttachmentRequest {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  isPhotoProof?: boolean;
}

// Export data
export interface ChoreExportData {
  format: 'csv' | 'json';
  data: string;
  fileName: string;
  choreCount: number;
}

// Report export
export interface ReportExportData {
  period: { start: string; end: string };
  completions: ChoreCompletion[];
}
