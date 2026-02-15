export type WellnessActivityCategory =
  | 'chores'
  | 'physical'
  | 'creative'
  | 'educational'
  | 'social'
  | 'self_care'
  | 'outdoor'
  | 'other';

export interface ActivityLog {
  id: string;
  householdId: string;
  memberId: string;
  category: WellnessActivityCategory;
  activityName: string;
  durationMinutes: number;
  caloriesEstimate: number | null;
  note: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface ActivityGoal {
  id: string;
  householdId: string;
  memberId: string;
  category: WellnessActivityCategory | 'all';
  targetMinutesPerDay: number;
  targetMinutesPerWeek: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivitySummary {
  memberId: string;
  memberName: string;
  totalMinutesToday: number;
  totalMinutesThisWeek: number;
  categoryBreakdown: Record<WellnessActivityCategory, number>;
  dailyGoalProgress: number;
  weeklyGoalProgress: number;
  streak: number;
}

export interface CreateActivityLogRequest {
  memberId: string;
  category: WellnessActivityCategory;
  activityName: string;
  durationMinutes: number;
  caloriesEstimate?: number | null;
  note?: string | null;
  loggedAt?: string;
}

export interface UpdateActivityGoalRequest {
  category?: WellnessActivityCategory | 'all';
  targetMinutesPerDay?: number;
  targetMinutesPerWeek?: number;
  isActive?: boolean;
}

export interface ActivityStatsRequest {
  memberId?: string;
  startDate?: string;
  endDate?: string;
}

export interface HouseholdActivityStats {
  members: ActivitySummary[];
  householdTotalMinutesToday: number;
  householdTotalMinutesThisWeek: number;
  mostActiveCategory: WellnessActivityCategory;
  averageMinutesPerMember: number;
}

// ===== Wellness Check-ins (F14.2) =====

export interface WellnessCheckIn {
  id: string;
  householdId: string;
  memberId: string;
  moodScore: number;
  energyScore: number;
  stressScore: number | null;
  sleepQualityScore: number | null;
  note: string | null;
  checkedInAt: string;
  createdAt: string;
}

export interface CreateCheckInRequest {
  memberId: string;
  moodScore: number;
  energyScore: number;
  stressScore?: number;
  sleepQualityScore?: number;
  note?: string | null;
}

export interface WellnessTrends {
  moodTrend: { date: string; value: number }[];
  energyTrend: { date: string; value: number }[];
  stressTrend: { date: string; value: number }[];
  averageMood: number;
  averageEnergy: number;
}

// ===== Sleep Logs (F14.3) =====

export interface SleepLog {
  id: string;
  householdId: string;
  memberId: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  qualityScore: number | null;
  note: string | null;
  logDate: string;
  createdAt: string;
}

export interface CreateSleepLogRequest {
  memberId: string;
  bedtime: string;
  wakeTime: string;
  qualityScore?: number;
  note?: string | null;
}

export interface SleepStats {
  averageDurationMinutes: number;
  averageQuality: number;
  averageBedtime: string | null;
  averageWakeTime: string | null;
  consistencyScore: number;
  weeklyTrend: { date: string; durationMinutes: number; quality: number }[];
}

// ===== Meal Plans (F14.4) =====

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealPlan {
  id: string;
  householdId: string;
  mealType: MealType;
  name: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  calories: number | null;
  plannedDate: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface CreateMealPlanRequest {
  mealType: MealType;
  name: string;
  description?: string | null;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  calories?: number;
  plannedDate: string;
}

export interface UpdateMealPlanRequest {
  name?: string;
  description?: string | null;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  calories?: number;
  isCompleted?: boolean;
}

// ===== Mental Health Resources (F14.5) =====

export type MentalHealthCategory =
  | 'mindfulness'
  | 'coping_skills'
  | 'breathing'
  | 'journaling'
  | 'crisis_support'
  | 'family_therapy'
  | 'other';

export interface MentalHealthResource {
  id: string;
  householdId: string;
  category: MentalHealthCategory;
  title: string;
  description: string | null;
  resourceUrl: string | null;
  ageRange: string | null;
  isPinned: boolean;
  createdAt: string;
}

export interface CreateMentalHealthResourceRequest {
  category: MentalHealthCategory;
  title: string;
  description?: string | null;
  resourceUrl?: string | null;
  ageRange?: string | null;
}

export interface GratitudeEntry {
  id: string;
  householdId: string;
  memberId: string;
  content: string;
  createdAt: string;
}

export interface CreateGratitudeRequest {
  memberId: string;
  content: string;
}

export interface MoodJournal {
  entries: WellnessCheckIn[];
  streakDays: number;
  averageMood: number;
}
