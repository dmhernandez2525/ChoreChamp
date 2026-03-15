// School & Extracurricular Integration Types

export type ActivityCategory = 'sports' | 'music' | 'arts' | 'academic' | 'volunteer' | 'club' | 'religious' | 'other';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type EventType = 'practice' | 'game' | 'competition' | 'performance' | 'meeting' | 'class' | 'volunteer' | 'other';

export type SeasonType = 'fall' | 'winter' | 'spring' | 'summer' | 'year_round';

export interface SchoolSchedule {
  id: string;
  memberId: string;
  householdId: string;
  schoolName: string;
  schoolYear: string;
  gradeLevel: string;
  startTime: string;
  endTime: string;
  timezone: string;
  schoolDays: DayOfWeek[];
  lunchTime?: string | null;
  breakTimes?: BreakTime[] | null;
  importedFrom?: string | null;
  lastSyncedAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BreakTime {
  name: string;
  startTime: string;
  endTime: string;
}

export interface ClassPeriod {
  id: string;
  scheduleId: string;
  memberId: string;
  householdId: string;
  className: string;
  teacherName?: string | null;
  roomNumber?: string | null;
  periodNumber: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  color?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtracurricularActivity {
  id: string;
  memberId: string;
  householdId: string;
  name: string;
  description?: string | null;
  category: ActivityCategory;
  organization?: string | null;
  coachName?: string | null;
  coachContact?: string | null;
  location?: string | null;
  season: SeasonType;
  seasonStartDate?: Date | null;
  seasonEndDate?: Date | null;
  commitmentLevel: 'low' | 'medium' | 'high' | 'competitive';
  weeklyHours: number;
  cost?: number | null;
  equipmentNeeded?: string[] | null;
  choreAdjustmentPercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivitySchedule {
  id: string;
  activityId: string;
  memberId: string;
  householdId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  eventType: EventType;
  location?: string | null;
  isRecurring: boolean;
  notes?: string | null;
  createdAt: Date;
}

export interface ActivityEvent {
  id: string;
  activityId: string;
  memberId: string;
  householdId: string;
  title: string;
  eventType: EventType;
  eventDate: Date;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  opponent?: string | null;
  isHomeGame?: boolean | null;
  attendanceRequired: boolean;
  choreExemption: boolean;
  notes?: string | null;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeLog {
  id: string;
  activityId: string;
  memberId: string;
  householdId: string;
  practiceDate: Date;
  durationMinutes: number;
  practiceType: 'team' | 'individual' | 'lesson' | 'game';
  intensityLevel: number;
  skillsFocused?: string[] | null;
  notes?: string | null;
  coachFeedback?: string | null;
  selfRating?: number | null;
  createdAt: Date;
}

export interface VolunteerLog {
  id: string;
  memberId: string;
  householdId: string;
  organizationName: string;
  activityDescription: string;
  volunteerDate: Date;
  hoursCompleted: number;
  supervisorName?: string | null;
  supervisorContact?: string | null;
  verified: boolean;
  verifiedAt?: Date | null;
  verifiedBy?: string | null;
  certificateUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollegePrepActivity {
  id: string;
  memberId: string;
  householdId: string;
  activityType: 'test_prep' | 'college_visit' | 'application' | 'essay' | 'recommendation' | 'interview' | 'scholarship' | 'other';
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  status: 'not_started' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  relatedCollege?: string | null;
  notes?: string | null;
  attachments?: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleConflict {
  id: string;
  memberId: string;
  householdId: string;
  conflictDate: Date;
  conflictType: 'school_activity' | 'activity_activity' | 'activity_chore';
  item1Type: string;
  item1Id: string;
  item1Name: string;
  item2Type: string;
  item2Id: string;
  item2Name: string;
  resolved: boolean;
  resolution?: string | null;
  createdAt: Date;
}

export interface BalanceRecommendation {
  id: string;
  memberId: string;
  householdId: string;
  recommendationType: 'reduce_activities' | 'reduce_chores' | 'schedule_adjustment' | 'rest_day' | 'time_management';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  metrics: BalanceMetrics;
  acknowledged: boolean;
  acknowledgedAt?: Date | null;
  createdAt: Date;
}

export interface BalanceMetrics {
  weeklySchoolHours: number;
  weeklyActivityHours: number;
  weeklyChoreHours: number;
  weeklyFreeTimeHours: number;
  sleepHoursAverage: number;
  stressIndicators: string[];
}

export interface TeamRoster {
  id: string;
  activityId: string;
  householdId: string;
  memberName: string;
  position?: string | null;
  jerseyNumber?: number | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  parentName?: string | null;
  notes?: string | null;
  createdAt: Date;
}

// Input types
export interface CreateSchoolScheduleInput {
  memberId: string;
  schoolName: string;
  schoolYear: string;
  gradeLevel: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  schoolDays: DayOfWeek[];
  lunchTime?: string;
  breakTimes?: BreakTime[];
}

export interface CreateActivityInput {
  memberId: string;
  name: string;
  description?: string;
  category: ActivityCategory;
  organization?: string;
  coachName?: string;
  coachContact?: string;
  location?: string;
  season: SeasonType;
  seasonStartDate?: string;
  seasonEndDate?: string;
  commitmentLevel: 'low' | 'medium' | 'high' | 'competitive';
  weeklyHours: number;
  cost?: number;
  equipmentNeeded?: string[];
  choreAdjustmentPercent?: number;
}

export interface CreateEventInput {
  activityId: string;
  memberId: string;
  title: string;
  eventType: EventType;
  eventDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  opponent?: string;
  isHomeGame?: boolean;
  attendanceRequired?: boolean;
  choreExemption?: boolean;
  notes?: string;
}

export interface LogActivityPracticeInput {
  activityId: string;
  memberId: string;
  practiceDate: string;
  durationMinutes: number;
  practiceType: 'team' | 'individual' | 'lesson' | 'game';
  intensityLevel: number;
  skillsFocused?: string[];
  notes?: string;
  selfRating?: number;
}

export interface LogVolunteerInput {
  memberId: string;
  organizationName: string;
  activityDescription: string;
  volunteerDate: string;
  hoursCompleted: number;
  supervisorName?: string;
  supervisorContact?: string;
  notes?: string;
}

export interface CreateCollegePrepInput {
  memberId: string;
  activityType: 'test_prep' | 'college_visit' | 'application' | 'essay' | 'recommendation' | 'interview' | 'scholarship' | 'other';
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  relatedCollege?: string;
  notes?: string;
}

// Constants
export const ACTIVITY_CATEGORIES: Record<ActivityCategory, { label: string; icon: string; color: string }> = {
  sports: { label: 'Sports', icon: '\u26BD', color: '#22c55e' },
  music: { label: 'Music', icon: '\uD83C\uDFB5', color: '#8b5cf6' },
  arts: { label: 'Arts', icon: '\uD83C\uDFA8', color: '#ec4899' },
  academic: { label: 'Academic', icon: '\uD83D\uDCDA', color: '#3b82f6' },
  volunteer: { label: 'Volunteer', icon: '\u2764\uFE0F', color: '#ef4444' },
  club: { label: 'Club', icon: '\uD83D\uDC65', color: '#f59e0b' },
  religious: { label: 'Religious', icon: '\u2728', color: '#6366f1' },
  other: { label: 'Other', icon: '\uD83D\uDCCC', color: '#6b7280' },
};

export const COMMITMENT_LEVELS: Record<string, { label: string; hoursRange: string; choreAdjustment: number }> = {
  low: { label: 'Low', hoursRange: '1-3 hrs/week', choreAdjustment: 0 },
  medium: { label: 'Medium', hoursRange: '4-8 hrs/week', choreAdjustment: 15 },
  high: { label: 'High', hoursRange: '9-15 hrs/week', choreAdjustment: 25 },
  competitive: { label: 'Competitive', hoursRange: '15+ hrs/week', choreAdjustment: 40 },
};

export const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const EVENT_TYPES: Record<EventType, { label: string; icon: string }> = {
  practice: { label: 'Practice', icon: '\uD83C\uDFCB\uFE0F' },
  game: { label: 'Game', icon: '\uD83C\uDFC6' },
  competition: { label: 'Competition', icon: '\uD83E\uDD47' },
  performance: { label: 'Performance', icon: '\uD83C\uDFAD' },
  meeting: { label: 'Meeting', icon: '\uD83D\uDCAC' },
  class: { label: 'Class', icon: '\uD83D\uDCDD' },
  volunteer: { label: 'Volunteer', icon: '\u2764\uFE0F' },
  other: { label: 'Other', icon: '\uD83D\uDCC5' },
};
