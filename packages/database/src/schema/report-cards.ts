import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  date,
  index,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';
import { subjects } from './homework';

/**
 * Grading Scales - define how grades are interpreted
 */
export const gradingScales = pgTable('grading_scales', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  scaleType: text('scale_type').notNull().default('letter'),
  grades: jsonb('grades').$type<Array<{
    label: string;
    minValue: number;
    maxValue: number;
    gpaValue: number;
    bonusMultiplier: number;
    color: string;
  }>>().notNull(),

  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  householdIdx: index('grading_scales_household_idx').on(table.householdId),
}));

/**
 * Report Cards - uploaded report cards with grades
 */
export const reportCards = pgTable('report_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  // Period info
  schoolYear: text('school_year').notNull(),
  periodType: text('period_type').notNull(),
  periodNumber: integer('period_number').notNull(),
  periodName: text('period_name').notNull(),
  issueDate: date('issue_date').notNull(),

  // OCR processing
  imageUrl: text('image_url'),
  ocrProcessed: boolean('ocr_processed').notNull().default(false),
  ocrRawText: text('ocr_raw_text'),

  // Calculated values
  gpa: real('gpa'),
  totalBonusEarned: integer('total_bonus_earned').notNull().default(0),

  // Parent acknowledgment
  parentAcknowledged: boolean('parent_acknowledged').notNull().default(false),
  parentAcknowledgedAt: timestamp('parent_acknowledged_at'),
  parentAcknowledgedBy: uuid('parent_acknowledged_by'),

  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberYearIdx: index('report_cards_member_year_idx').on(table.memberId, table.schoolYear),
  periodIdx: index('report_cards_period_idx').on(table.memberId, table.periodType, table.periodNumber),
}));

/**
 * Report Card Grades - individual grades on a report card
 */
export const reportCardGrades = pgTable('report_card_grades', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportCardId: uuid('report_card_id')
    .notNull()
    .references(() => reportCards.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),

  subjectName: text('subject_name').notNull(),
  letterGrade: text('letter_grade'),
  percentageGrade: real('percentage_grade'),
  gpaValue: real('gpa_value'),
  credits: real('credits'),
  teacherComments: text('teacher_comments'),

  // Improvement tracking
  previousGrade: text('previous_grade'),
  gradeImprovement: real('grade_improvement'),

  bonusEarned: integer('bonus_earned').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  reportCardIdx: index('report_card_grades_card_idx').on(table.reportCardId),
}));

/**
 * Grade Bonus Configs - how bonuses are calculated
 */
export const gradeBonusConfigs = pgTable('grade_bonus_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),

  bonusType: text('bonus_type').notNull(),
  gradeThreshold: text('grade_threshold'),
  gpaThreshold: real('gpa_threshold'),
  improvementThreshold: real('improvement_threshold'),

  bonusPoints: integer('bonus_points').notNull(),
  bonusMultiplier: real('bonus_multiplier').notNull().default(1.0),
  maxBonusPerCard: integer('max_bonus_per_card'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  householdActiveIdx: index('grade_bonus_configs_household_active_idx').on(table.householdId, table.isActive),
}));

/**
 * Academic Goals - goals for grades, GPA, etc.
 */
export const academicGoals = pgTable('academic_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  goalType: text('goal_type').notNull(),
  targetValue: real('target_value').notNull(),
  targetGrade: text('target_grade'),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  subjectName: text('subject_name'),

  schoolYear: text('school_year').notNull(),
  periodType: text('period_type').notNull(),
  periodNumber: integer('period_number'),

  currentProgress: real('current_progress').notNull().default(0),
  isAchieved: boolean('is_achieved').notNull().default(false),
  achievedAt: timestamp('achieved_at'),

  bonusOnAchievement: integer('bonus_on_achievement').notNull().default(0),
  deadline: timestamp('deadline'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberYearIdx: index('academic_goals_member_year_idx').on(table.memberId, table.schoolYear),
}));

/**
 * Academic Achievements - earned achievements for academic performance
 */
export const academicAchievements = pgTable('academic_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  reportCardId: uuid('report_card_id').references(() => reportCards.id, { onDelete: 'set null' }),

  achievementType: text('achievement_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  iconUrl: text('icon_url'),

  schoolYear: text('school_year').notNull(),
  periodType: text('period_type'),
  periodNumber: integer('period_number'),

  bonusEarned: integer('bonus_earned').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  earnedAt: timestamp('earned_at').notNull().defaultNow(),
  celebrationShown: boolean('celebration_shown').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberYearIdx: index('academic_achievements_member_year_idx').on(table.memberId, table.schoolYear),
  typeIdx: index('academic_achievements_type_idx').on(table.memberId, table.achievementType),
}));

/**
 * Attendance Records - attendance tracking per period
 */
export const attendanceRecords = pgTable('attendance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  schoolYear: text('school_year').notNull(),
  periodType: text('period_type').notNull(),
  periodNumber: integer('period_number').notNull(),

  totalDays: integer('total_days').notNull(),
  daysPresent: integer('days_present').notNull(),
  daysAbsent: integer('days_absent').notNull().default(0),
  daysExcused: integer('days_excused').notNull().default(0),
  daysTardy: integer('days_tardy').notNull().default(0),

  attendancePercentage: real('attendance_percentage').notNull(),
  isPerfect: boolean('is_perfect').notNull().default(false),
  bonusEarned: integer('bonus_earned').notNull().default(0),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberYearIdx: index('attendance_records_member_year_idx').on(table.memberId, table.schoolYear),
  periodIdx: index('attendance_records_period_idx').on(table.memberId, table.periodType, table.periodNumber),
}));

/**
 * Academic Trends - historical tracking of academic metrics
 */
export const academicTrends = pgTable('academic_trends', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),

  subjectName: text('subject_name'),
  metricType: text('metric_type').notNull(),

  schoolYear: text('school_year').notNull(),
  periodType: text('period_type').notNull(),
  periodNumber: integer('period_number').notNull(),

  value: real('value').notNull(),
  previousValue: real('previous_value'),
  changePercent: real('change_percent'),
  trendDirection: text('trend_direction').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberMetricIdx: index('academic_trends_member_metric_idx').on(table.memberId, table.metricType),
  yearPeriodIdx: index('academic_trends_year_period_idx').on(table.memberId, table.schoolYear, table.periodNumber),
}));

/**
 * Honor Roll Configs - configuration for honor roll levels
 */
export const honorRollConfigs = pgTable('honor_roll_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  minGpa: real('min_gpa').notNull(),
  requiresNoFailingGrades: boolean('requires_no_failing_grades').notNull().default(true),
  requiresPerfectAttendance: boolean('requires_perfect_attendance').notNull().default(false),

  bonusPoints: integer('bonus_points').notNull(),
  badgeTitle: text('badge_title').notNull(),
  badgeIcon: text('badge_icon').notNull(),
  badgeColor: text('badge_color').notNull(),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  householdActiveIdx: index('honor_roll_configs_household_active_idx').on(table.householdId, table.isActive),
}));

// Relations
export const gradingScalesRelations = relations(gradingScales, ({ one }) => ({
  household: one(households, {
    fields: [gradingScales.householdId],
    references: [households.id],
  }),
}));

export const reportCardsRelations = relations(reportCards, ({ one, many }) => ({
  household: one(households, {
    fields: [reportCards.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [reportCards.memberId],
    references: [members.id],
  }),
  grades: many(reportCardGrades),
  achievements: many(academicAchievements),
}));

export const reportCardGradesRelations = relations(reportCardGrades, ({ one }) => ({
  reportCard: one(reportCards, {
    fields: [reportCardGrades.reportCardId],
    references: [reportCards.id],
  }),
  subject: one(subjects, {
    fields: [reportCardGrades.subjectId],
    references: [subjects.id],
  }),
}));

export const gradeBonusConfigsRelations = relations(gradeBonusConfigs, ({ one }) => ({
  household: one(households, {
    fields: [gradeBonusConfigs.householdId],
    references: [households.id],
  }),
}));

export const academicGoalsRelations = relations(academicGoals, ({ one }) => ({
  household: one(households, {
    fields: [academicGoals.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [academicGoals.memberId],
    references: [members.id],
  }),
  subject: one(subjects, {
    fields: [academicGoals.subjectId],
    references: [subjects.id],
  }),
}));

export const academicAchievementsRelations = relations(academicAchievements, ({ one }) => ({
  household: one(households, {
    fields: [academicAchievements.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [academicAchievements.memberId],
    references: [members.id],
  }),
  reportCard: one(reportCards, {
    fields: [academicAchievements.reportCardId],
    references: [reportCards.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  household: one(households, {
    fields: [attendanceRecords.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [attendanceRecords.memberId],
    references: [members.id],
  }),
}));

export const academicTrendsRelations = relations(academicTrends, ({ one }) => ({
  household: one(households, {
    fields: [academicTrends.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [academicTrends.memberId],
    references: [members.id],
  }),
  subject: one(subjects, {
    fields: [academicTrends.subjectId],
    references: [subjects.id],
  }),
}));

export const honorRollConfigsRelations = relations(honorRollConfigs, ({ one }) => ({
  household: one(households, {
    fields: [honorRollConfigs.householdId],
    references: [households.id],
  }),
}));
