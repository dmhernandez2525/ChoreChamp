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

/**
 * School Schedules - primary school schedule for a member
 */
export const schoolSchedules = pgTable('school_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  schoolName: text('school_name').notNull(),
  schoolYear: text('school_year').notNull(),
  gradeLevel: text('grade_level').notNull(),

  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  timezone: text('timezone').notNull().default('America/New_York'),

  schoolDays: jsonb('school_days').$type<string[]>().notNull(),
  lunchTime: text('lunch_time'),
  breakTimes: jsonb('break_times').$type<Array<{ name: string; startTime: string; endTime: string }>>(),

  importedFrom: text('imported_from'),
  lastSyncedAt: timestamp('last_synced_at'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('school_schedules_member_idx').on(table.memberId),
}));

/**
 * Class Periods - individual classes in a school schedule
 */
export const classPeriods = pgTable('class_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id')
    .notNull()
    .references(() => schoolSchedules.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  className: text('class_name').notNull(),
  teacherName: text('teacher_name'),
  roomNumber: text('room_number'),

  periodNumber: integer('period_number').notNull(),
  dayOfWeek: text('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),

  color: text('color'),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  scheduleIdx: index('class_periods_schedule_idx').on(table.scheduleId),
  memberDayIdx: index('class_periods_member_day_idx').on(table.memberId, table.dayOfWeek),
}));

/**
 * Extracurricular Activities - sports, clubs, music, etc.
 */
export const extracurricularActivities = pgTable('extracurricular_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  organization: text('organization'),
  coachName: text('coach_name'),
  coachContact: text('coach_contact'),
  location: text('location'),

  season: text('season').notNull().default('year_round'),
  seasonStartDate: date('season_start_date'),
  seasonEndDate: date('season_end_date'),

  commitmentLevel: text('commitment_level').notNull().default('medium'),
  weeklyHours: real('weekly_hours').notNull().default(0),
  cost: real('cost'),
  equipmentNeeded: jsonb('equipment_needed').$type<string[]>(),

  choreAdjustmentPercent: integer('chore_adjustment_percent').notNull().default(0),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('extracurricular_activities_member_idx').on(table.memberId),
  categoryIdx: index('extracurricular_activities_category_idx').on(table.memberId, table.category),
}));

/**
 * Activity Schedules - recurring schedules for activities
 */
export const activitySchedules = pgTable('activity_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => extracurricularActivities.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  dayOfWeek: text('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  eventType: text('event_type').notNull().default('practice'),
  location: text('location'),
  isRecurring: boolean('is_recurring').notNull().default(true),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  activityIdx: index('activity_schedules_activity_idx').on(table.activityId),
}));

/**
 * Activity Events - specific events (games, performances, etc.)
 */
export const activityEvents = pgTable('activity_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => extracurricularActivities.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  title: text('title').notNull(),
  eventType: text('event_type').notNull(),
  eventDate: date('event_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time'),
  location: text('location'),

  opponent: text('opponent'),
  isHomeGame: boolean('is_home_game'),

  attendanceRequired: boolean('attendance_required').notNull().default(true),
  choreExemption: boolean('chore_exemption').notNull().default(false),

  notes: text('notes'),
  reminderSent: boolean('reminder_sent').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  activityDateIdx: index('activity_events_activity_date_idx').on(table.activityId, table.eventDate),
  memberDateIdx: index('activity_events_member_date_idx').on(table.memberId, table.eventDate),
}));

/**
 * Practice Logs - log practice sessions
 */
export const practiceLogs = pgTable('practice_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => extracurricularActivities.id, { onDelete: 'cascade' }),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  practiceDate: date('practice_date').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  practiceType: text('practice_type').notNull(),
  intensityLevel: integer('intensity_level').notNull(),

  skillsFocused: jsonb('skills_focused').$type<string[]>(),
  notes: text('notes'),
  coachFeedback: text('coach_feedback'),
  selfRating: integer('self_rating'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberDateIdx: index('practice_logs_member_date_idx').on(table.memberId, table.practiceDate),
}));

/**
 * Volunteer Logs - track volunteer hours
 */
export const volunteerLogs = pgTable('volunteer_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  organizationName: text('organization_name').notNull(),
  activityDescription: text('activity_description').notNull(),
  volunteerDate: date('volunteer_date').notNull(),
  hoursCompleted: real('hours_completed').notNull(),

  supervisorName: text('supervisor_name'),
  supervisorContact: text('supervisor_contact'),

  verified: boolean('verified').notNull().default(false),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => members.id, { onDelete: 'set null' }),

  certificateUrl: text('certificate_url'),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberDateIdx: index('volunteer_logs_member_date_idx').on(table.memberId, table.volunteerDate),
}));

/**
 * College Prep Activities - track college prep tasks
 */
export const collegePrepActivities = pgTable('college_prep_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  activityType: text('activity_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),

  dueDate: date('due_date'),
  completedAt: timestamp('completed_at'),
  status: text('status').notNull().default('not_started'),
  priority: text('priority').notNull().default('medium'),

  relatedCollege: text('related_college'),
  notes: text('notes'),
  attachments: jsonb('attachments').$type<string[]>(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  memberStatusIdx: index('college_prep_activities_member_status_idx').on(table.memberId, table.status),
}));

/**
 * Schedule Conflicts - detected scheduling conflicts
 */
export const scheduleConflicts = pgTable('schedule_conflicts', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  conflictDate: date('conflict_date').notNull(),
  conflictType: text('conflict_type').notNull(),

  item1Type: text('item1_type').notNull(),
  item1Id: text('item1_id').notNull(),
  item1Name: text('item1_name').notNull(),

  item2Type: text('item2_type').notNull(),
  item2Id: text('item2_id').notNull(),
  item2Name: text('item2_name').notNull(),

  resolved: boolean('resolved').notNull().default(false),
  resolution: text('resolution'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberDateIdx: index('schedule_conflicts_member_date_idx').on(table.memberId, table.conflictDate),
}));

/**
 * Balance Recommendations - AI-generated schedule recommendations
 */
export const balanceRecommendations = pgTable('balance_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id')
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  recommendationType: text('recommendation_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull().default('medium'),

  metrics: jsonb('metrics').$type<{
    weeklySchoolHours: number;
    weeklyActivityHours: number;
    weeklyChoreHours: number;
    weeklyFreeTimeHours: number;
    sleepHoursAverage: number;
    stressIndicators: string[];
  }>().notNull(),

  acknowledged: boolean('acknowledged').notNull().default(false),
  acknowledgedAt: timestamp('acknowledged_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  memberIdx: index('balance_recommendations_member_idx').on(table.memberId),
}));

/**
 * Team Rosters - team contact info
 */
export const teamRosters = pgTable('team_rosters', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id')
    .notNull()
    .references(() => extracurricularActivities.id, { onDelete: 'cascade' }),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),

  memberName: text('member_name').notNull(),
  position: text('position'),
  jerseyNumber: integer('jersey_number'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  parentName: text('parent_name'),
  notes: text('notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  activityIdx: index('team_rosters_activity_idx').on(table.activityId),
}));

// Relations
export const schoolSchedulesRelations = relations(schoolSchedules, ({ one, many }) => ({
  household: one(households, {
    fields: [schoolSchedules.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [schoolSchedules.memberId],
    references: [members.id],
  }),
  classPeriods: many(classPeriods),
}));

export const classPeriodsRelations = relations(classPeriods, ({ one }) => ({
  household: one(households, {
    fields: [classPeriods.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [classPeriods.memberId],
    references: [members.id],
  }),
  schedule: one(schoolSchedules, {
    fields: [classPeriods.scheduleId],
    references: [schoolSchedules.id],
  }),
}));

export const extracurricularActivitiesRelations = relations(extracurricularActivities, ({ one, many }) => ({
  household: one(households, {
    fields: [extracurricularActivities.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [extracurricularActivities.memberId],
    references: [members.id],
  }),
  schedules: many(activitySchedules),
  events: many(activityEvents),
  practiceLogs: many(practiceLogs),
  teamRoster: many(teamRosters),
}));

export const activitySchedulesRelations = relations(activitySchedules, ({ one }) => ({
  household: one(households, {
    fields: [activitySchedules.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [activitySchedules.memberId],
    references: [members.id],
  }),
  activity: one(extracurricularActivities, {
    fields: [activitySchedules.activityId],
    references: [extracurricularActivities.id],
  }),
}));

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  household: one(households, {
    fields: [activityEvents.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [activityEvents.memberId],
    references: [members.id],
  }),
  activity: one(extracurricularActivities, {
    fields: [activityEvents.activityId],
    references: [extracurricularActivities.id],
  }),
}));

export const practiceLogsRelations = relations(practiceLogs, ({ one }) => ({
  household: one(households, {
    fields: [practiceLogs.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [practiceLogs.memberId],
    references: [members.id],
  }),
  activity: one(extracurricularActivities, {
    fields: [practiceLogs.activityId],
    references: [extracurricularActivities.id],
  }),
}));

export const volunteerLogsRelations = relations(volunteerLogs, ({ one }) => ({
  household: one(households, {
    fields: [volunteerLogs.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [volunteerLogs.memberId],
    references: [members.id],
  }),
  verifier: one(members, {
    fields: [volunteerLogs.verifiedBy],
    references: [members.id],
  }),
}));

export const collegePrepActivitiesRelations = relations(collegePrepActivities, ({ one }) => ({
  household: one(households, {
    fields: [collegePrepActivities.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [collegePrepActivities.memberId],
    references: [members.id],
  }),
}));

export const scheduleConflictsRelations = relations(scheduleConflicts, ({ one }) => ({
  household: one(households, {
    fields: [scheduleConflicts.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [scheduleConflicts.memberId],
    references: [members.id],
  }),
}));

export const balanceRecommendationsRelations = relations(balanceRecommendations, ({ one }) => ({
  household: one(households, {
    fields: [balanceRecommendations.householdId],
    references: [households.id],
  }),
  member: one(members, {
    fields: [balanceRecommendations.memberId],
    references: [members.id],
  }),
}));

export const teamRostersRelations = relations(teamRosters, ({ one }) => ({
  household: one(households, {
    fields: [teamRosters.householdId],
    references: [households.id],
  }),
  activity: one(extracurricularActivities, {
    fields: [teamRosters.activityId],
    references: [extracurricularActivities.id],
  }),
}));
