// Report Card Bonus System Types

export type GradingScaleType = 'letter' | 'percentage' | 'gpa' | 'pass_fail' | 'custom';

export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F';

export type AcademicPeriodType = 'quarter' | 'trimester' | 'semester' | 'year';

export type AchievementType = 'honor_roll' | 'principals_list' | 'perfect_attendance' | 'improvement' | 'subject_excellence' | 'gpa_milestone' | 'streak' | 'custom';

export interface GradingScale {
  id: string;
  householdId: string;
  name: string;
  scaleType: GradingScaleType;
  grades: GradeDefinition[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeDefinition {
  label: string;
  minValue: number;
  maxValue: number;
  gpaValue: number;
  bonusMultiplier: number;
  color: string;
}

export interface ReportCard {
  id: string;
  memberId: string;
  householdId: string;
  schoolYear: string;
  periodType: AcademicPeriodType;
  periodNumber: number;
  periodName: string;
  issueDate: Date;
  imageUrl?: string | null;
  ocrProcessed: boolean;
  ocrRawText?: string | null;
  gpa?: number | null;
  totalBonusEarned: number;
  parentAcknowledged: boolean;
  parentAcknowledgedAt?: Date | null;
  parentAcknowledgedBy?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportCardGrade {
  id: string;
  reportCardId: string;
  subjectId?: string | null;
  subjectName: string;
  letterGrade?: LetterGrade | null;
  percentageGrade?: number | null;
  gpaValue?: number | null;
  credits?: number | null;
  teacherComments?: string | null;
  previousGrade?: string | null;
  gradeImprovement?: number | null;
  bonusEarned: number;
  createdAt: Date;
}

export interface GradeBonusConfig {
  id: string;
  householdId: string;
  name: string;
  description?: string | null;
  bonusType: 'per_grade' | 'gpa_threshold' | 'improvement' | 'perfect_attendance' | 'honor_roll';
  gradeThreshold?: string | null;
  gpaThreshold?: number | null;
  improvementThreshold?: number | null;
  bonusPoints: number;
  bonusMultiplier: number;
  maxBonusPerCard?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicGoal {
  id: string;
  memberId: string;
  householdId: string;
  goalType: 'gpa' | 'grade' | 'attendance' | 'improvement' | 'honor_roll';
  targetValue: number;
  targetGrade?: string | null;
  subjectId?: string | null;
  subjectName?: string | null;
  schoolYear: string;
  periodType: AcademicPeriodType;
  periodNumber?: number | null;
  currentProgress: number;
  isAchieved: boolean;
  achievedAt?: Date | null;
  bonusOnAchievement: number;
  deadline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicAchievement {
  id: string;
  memberId: string;
  householdId: string;
  achievementType: AchievementType;
  title: string;
  description: string;
  iconUrl?: string | null;
  schoolYear: string;
  periodType?: AcademicPeriodType | null;
  periodNumber?: number | null;
  reportCardId?: string | null;
  bonusEarned: number;
  metadata?: Record<string, unknown> | null;
  earnedAt: Date;
  celebrationShown: boolean;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  householdId: string;
  schoolYear: string;
  periodType: AcademicPeriodType;
  periodNumber: number;
  totalDays: number;
  daysPresent: number;
  daysAbsent: number;
  daysExcused: number;
  daysTardy: number;
  attendancePercentage: number;
  isPerfect: boolean;
  bonusEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicTrend {
  id: string;
  memberId: string;
  householdId: string;
  subjectId?: string | null;
  subjectName?: string | null;
  metricType: 'gpa' | 'grade' | 'attendance';
  schoolYear: string;
  periodType: AcademicPeriodType;
  periodNumber: number;
  value: number;
  previousValue?: number | null;
  changePercent?: number | null;
  trendDirection: 'up' | 'down' | 'stable';
  createdAt: Date;
}

export interface HonorRollConfig {
  id: string;
  householdId: string;
  name: string;
  minGpa: number;
  requiresNoFailingGrades: boolean;
  requiresPerfectAttendance: boolean;
  bonusPoints: number;
  badgeTitle: string;
  badgeIcon: string;
  badgeColor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for API
export interface CreateReportCardInput {
  memberId: string;
  schoolYear: string;
  periodType: AcademicPeriodType;
  periodNumber: number;
  periodName: string;
  issueDate: string;
  imageUrl?: string;
  grades: CreateReportCardGradeInput[];
  attendance?: {
    totalDays: number;
    daysPresent: number;
    daysAbsent: number;
    daysExcused: number;
    daysTardy: number;
  };
  notes?: string;
}

export interface CreateReportCardGradeInput {
  subjectId?: string;
  subjectName: string;
  letterGrade?: LetterGrade;
  percentageGrade?: number;
  gpaValue?: number;
  credits?: number;
  teacherComments?: string;
}

export interface UpdateReportCardInput {
  periodName?: string;
  issueDate?: string;
  notes?: string;
  parentAcknowledged?: boolean;
}

export interface CreateGradeBonusConfigInput {
  name: string;
  description?: string;
  bonusType: 'per_grade' | 'gpa_threshold' | 'improvement' | 'perfect_attendance' | 'honor_roll';
  gradeThreshold?: string;
  gpaThreshold?: number;
  improvementThreshold?: number;
  bonusPoints: number;
  bonusMultiplier?: number;
  maxBonusPerCard?: number;
}

export interface CreateAcademicGoalInput {
  memberId: string;
  goalType: 'gpa' | 'grade' | 'attendance' | 'improvement' | 'honor_roll';
  targetValue: number;
  targetGrade?: string;
  subjectId?: string;
  subjectName?: string;
  schoolYear: string;
  periodType: AcademicPeriodType;
  periodNumber?: number;
  bonusOnAchievement: number;
  deadline?: string;
}

export interface ProcessOcrInput {
  reportCardId: string;
  imageUrl: string;
}

// Constants
export const LETTER_GRADES: LetterGrade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

export const DEFAULT_GRADE_DEFINITIONS: GradeDefinition[] = [
  { label: 'A+', minValue: 97, maxValue: 100, gpaValue: 4.0, bonusMultiplier: 2.0, color: '#22c55e' },
  { label: 'A', minValue: 93, maxValue: 96.99, gpaValue: 4.0, bonusMultiplier: 1.8, color: '#22c55e' },
  { label: 'A-', minValue: 90, maxValue: 92.99, gpaValue: 3.7, bonusMultiplier: 1.6, color: '#4ade80' },
  { label: 'B+', minValue: 87, maxValue: 89.99, gpaValue: 3.3, bonusMultiplier: 1.4, color: '#3b82f6' },
  { label: 'B', minValue: 83, maxValue: 86.99, gpaValue: 3.0, bonusMultiplier: 1.2, color: '#3b82f6' },
  { label: 'B-', minValue: 80, maxValue: 82.99, gpaValue: 2.7, bonusMultiplier: 1.1, color: '#60a5fa' },
  { label: 'C+', minValue: 77, maxValue: 79.99, gpaValue: 2.3, bonusMultiplier: 1.0, color: '#eab308' },
  { label: 'C', minValue: 73, maxValue: 76.99, gpaValue: 2.0, bonusMultiplier: 0.9, color: '#eab308' },
  { label: 'C-', minValue: 70, maxValue: 72.99, gpaValue: 1.7, bonusMultiplier: 0.8, color: '#facc15' },
  { label: 'D+', minValue: 67, maxValue: 69.99, gpaValue: 1.3, bonusMultiplier: 0.5, color: '#f97316' },
  { label: 'D', minValue: 63, maxValue: 66.99, gpaValue: 1.0, bonusMultiplier: 0.3, color: '#f97316' },
  { label: 'D-', minValue: 60, maxValue: 62.99, gpaValue: 0.7, bonusMultiplier: 0.1, color: '#fb923c' },
  { label: 'F', minValue: 0, maxValue: 59.99, gpaValue: 0.0, bonusMultiplier: 0.0, color: '#ef4444' },
];

export const ACHIEVEMENT_ICONS: Record<AchievementType, string> = {
  honor_roll: '🏆',
  principals_list: '⭐',
  perfect_attendance: '📅',
  improvement: '📈',
  subject_excellence: '🎯',
  gpa_milestone: '🎓',
  streak: '🔥',
  custom: '🏅',
};

export const PERIOD_NAMES: Record<AcademicPeriodType, string[]> = {
  quarter: ['Q1', 'Q2', 'Q3', 'Q4'],
  trimester: ['T1', 'T2', 'T3'],
  semester: ['Fall', 'Spring'],
  year: ['Full Year'],
};
