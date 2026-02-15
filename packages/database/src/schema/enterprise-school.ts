import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
  unique,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { households } from './households';
import { members } from './members';

export const enterpriseDistricts = pgTable(
  'enterprise_districts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 160 }).notNull(),
    code: varchar('code', { length: 32 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_enterprise_districts_household').on(table.householdId),
    unique('unique_enterprise_district_code').on(table.householdId, table.code),
  ]
);

export const enterpriseSchools = pgTable(
  'enterprise_schools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    districtId: uuid('district_id').references(() => enterpriseDistricts.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 180 }).notNull(),
    schoolType: varchar('school_type', { length: 32 }).notNull().default('other'),
    timezone: varchar('timezone', { length: 50 }).notNull().default('America/New_York'),
    brandingName: varchar('branding_name', { length: 180 }),
    brandingLogoUrl: text('branding_logo_url'),
    brandingPrimaryColor: varchar('branding_primary_color', { length: 20 }),
    ferpaModeEnabled: boolean('ferpa_mode_enabled').notNull().default(true),
    coppaModeEnabled: boolean('coppa_mode_enabled').notNull().default(true),
    parentVisibilityDefault: varchar('parent_visibility_default', { length: 20 })
      .notNull()
      .default('summary'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_enterprise_schools_household').on(table.householdId),
    index('idx_enterprise_schools_district').on(table.districtId),
  ]
);

export const enterpriseClassrooms = pgTable(
  'enterprise_classrooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => enterpriseSchools.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    gradeLevel: varchar('grade_level', { length: 40 }).notNull(),
    section: varchar('section', { length: 20 }),
    subject: varchar('subject', { length: 80 }),
    teacherMemberId: uuid('teacher_member_id').references(() => members.id, {
      onDelete: 'set null',
    }),
    externalClassId: varchar('external_class_id', { length: 120 }),
    lmsProvider: varchar('lms_provider', { length: 32 }),
    lmsCourseId: varchar('lms_course_id', { length: 120 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_enterprise_classrooms_household').on(table.householdId),
    index('idx_enterprise_classrooms_school').on(table.schoolId),
  ]
);

export const enterpriseClassroomStudents = pgTable(
  'enterprise_classroom_students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => enterpriseSchools.id, { onDelete: 'cascade' }),
    classroomId: uuid('classroom_id')
      .notNull()
      .references(() => enterpriseClassrooms.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    studentNumber: varchar('student_number', { length: 60 }),
    visibilityModeOverride: varchar('visibility_mode_override', { length: 20 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_enterprise_classroom_students_classroom').on(table.classroomId),
    index('idx_enterprise_classroom_students_member').on(table.memberId),
    unique('unique_enterprise_classroom_student').on(table.classroomId, table.memberId),
  ]
);

export const enterpriseAssignments = pgTable(
  'enterprise_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => enterpriseSchools.id, { onDelete: 'cascade' }),
    classroomId: uuid('classroom_id')
      .notNull()
      .references(() => enterpriseClassrooms.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 180 }).notNull(),
    description: text('description'),
    assignmentType: varchar('assignment_type', { length: 20 }).notNull().default('task'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    points: integer('points').notNull().default(25),
    requiresProof: boolean('requires_proof').notNull().default(false),
    createdByMemberId: uuid('created_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_enterprise_assignments_classroom').on(table.classroomId, table.status),
    index('idx_enterprise_assignments_due').on(table.dueAt),
  ]
);

export const enterpriseAssignmentSubmissions = pgTable(
  'enterprise_assignment_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => enterpriseAssignments.id, { onDelete: 'cascade' }),
    studentMemberId: uuid('student_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 20 }).notNull().default('assigned'),
    evidenceNote: text('evidence_note'),
    score: integer('score'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewerMemberId: uuid('reviewer_member_id').references(() => members.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_enterprise_submissions_assignment').on(table.assignmentId),
    index('idx_enterprise_submissions_student').on(table.studentMemberId),
    unique('unique_enterprise_submission_student_assignment').on(
      table.assignmentId,
      table.studentMemberId
    ),
  ]
);

export const enterpriseChallenges = pgTable(
  'enterprise_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => enterpriseSchools.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 180 }).notNull(),
    description: text('description'),
    challengeType: varchar('challenge_type', { length: 20 }).notNull().default('school'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    rewardPoints: integer('reward_points').notNull().default(250),
    status: varchar('status', { length: 20 }).notNull().default('scheduled'),
    createdByMemberId: uuid('created_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_enterprise_challenges_school').on(table.schoolId, table.status)]
);

export const enterpriseChallengeParticipations = pgTable(
  'enterprise_challenge_participations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    challengeId: uuid('challenge_id')
      .notNull()
      .references(() => enterpriseChallenges.id, { onDelete: 'cascade' }),
    classroomId: uuid('classroom_id').references(() => enterpriseClassrooms.id, {
      onDelete: 'set null',
    }),
    studentMemberId: uuid('student_member_id').references(() => members.id, {
      onDelete: 'set null',
    }),
    progress: doublePrecision('progress').notNull().default(0),
    rank: integer('rank'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_enterprise_challenge_participations_challenge').on(table.challengeId)]
);

export const enterpriseBulkImports = pgTable(
  'enterprise_bulk_imports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => enterpriseSchools.id, { onDelete: 'cascade' }),
    classroomId: uuid('classroom_id').references(() => enterpriseClassrooms.id, {
      onDelete: 'set null',
    }),
    importType: varchar('import_type', { length: 20 }).notNull(),
    sourceFileName: varchar('source_file_name', { length: 255 }),
    rowCount: integer('row_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    errors: jsonb('errors').$type<Array<{ row: number; message: string }>>().notNull().default([]),
    importedByMemberId: uuid('imported_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('idx_enterprise_bulk_imports_school').on(table.schoolId, table.importedAt)]
);

export const enterpriseLmsIntegrations = pgTable(
  'enterprise_lms_integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => enterpriseSchools.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).notNull(),
    syncEnabled: boolean('sync_enabled').notNull().default(false),
    externalTenantId: varchar('external_tenant_id', { length: 180 }),
    clientId: varchar('client_id', { length: 180 }),
    configuration: jsonb('configuration'),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_enterprise_lms_school').on(table.schoolId),
    unique('unique_enterprise_lms_per_school').on(table.schoolId, table.provider),
  ]
);

export const enterpriseParentVisibility = pgTable(
  'enterprise_parent_visibility',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => enterpriseSchools.id, { onDelete: 'cascade' }),
    studentMemberId: uuid('student_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    visibilityMode: varchar('visibility_mode', { length: 20 }).notNull().default('summary'),
    allowTeacherMessages: boolean('allow_teacher_messages').notNull().default(true),
    allowChallengeVisibility: boolean('allow_challenge_visibility').notNull().default(true),
    updatedByMemberId: uuid('updated_by_member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique('unique_enterprise_parent_visibility').on(table.schoolId, table.studentMemberId),
  ]
);

export const enterpriseAdminAudits = pgTable(
  'enterprise_admin_audits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id').references(() => enterpriseSchools.id, { onDelete: 'set null' }),
    actorMemberId: uuid('actor_member_id').references(() => members.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 120 }).notNull(),
    targetType: varchar('target_type', { length: 80 }),
    targetId: varchar('target_id', { length: 120 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_enterprise_admin_audits_school').on(table.schoolId, table.createdAt),
    index('idx_enterprise_admin_audits_household').on(table.householdId, table.createdAt),
  ]
);

export const enterpriseDistrictsRelations = relations(enterpriseDistricts, ({ one, many }) => ({
  household: one(households, {
    fields: [enterpriseDistricts.householdId],
    references: [households.id],
  }),
  schools: many(enterpriseSchools),
}));

export const enterpriseSchoolsRelations = relations(enterpriseSchools, ({ one, many }) => ({
  household: one(households, {
    fields: [enterpriseSchools.householdId],
    references: [households.id],
  }),
  district: one(enterpriseDistricts, {
    fields: [enterpriseSchools.districtId],
    references: [enterpriseDistricts.id],
  }),
  classrooms: many(enterpriseClassrooms),
  assignments: many(enterpriseAssignments),
  challenges: many(enterpriseChallenges),
  lmsIntegrations: many(enterpriseLmsIntegrations),
  parentVisibility: many(enterpriseParentVisibility),
  audits: many(enterpriseAdminAudits),
}));

export const enterpriseClassroomsRelations = relations(enterpriseClassrooms, ({ one, many }) => ({
  school: one(enterpriseSchools, {
    fields: [enterpriseClassrooms.schoolId],
    references: [enterpriseSchools.id],
  }),
  teacher: one(members, {
    fields: [enterpriseClassrooms.teacherMemberId],
    references: [members.id],
  }),
  students: many(enterpriseClassroomStudents),
  assignments: many(enterpriseAssignments),
  challengeParticipations: many(enterpriseChallengeParticipations),
}));

export const enterpriseClassroomStudentsRelations = relations(
  enterpriseClassroomStudents,
  ({ one }) => ({
    school: one(enterpriseSchools, {
      fields: [enterpriseClassroomStudents.schoolId],
      references: [enterpriseSchools.id],
    }),
    classroom: one(enterpriseClassrooms, {
      fields: [enterpriseClassroomStudents.classroomId],
      references: [enterpriseClassrooms.id],
    }),
    member: one(members, {
      fields: [enterpriseClassroomStudents.memberId],
      references: [members.id],
    }),
  })
);

export const enterpriseAssignmentsRelations = relations(enterpriseAssignments, ({ one, many }) => ({
  classroom: one(enterpriseClassrooms, {
    fields: [enterpriseAssignments.classroomId],
    references: [enterpriseClassrooms.id],
  }),
  school: one(enterpriseSchools, {
    fields: [enterpriseAssignments.schoolId],
    references: [enterpriseSchools.id],
  }),
  creator: one(members, {
    fields: [enterpriseAssignments.createdByMemberId],
    references: [members.id],
  }),
  submissions: many(enterpriseAssignmentSubmissions),
}));

export const enterpriseAssignmentSubmissionsRelations = relations(
  enterpriseAssignmentSubmissions,
  ({ one }) => ({
    assignment: one(enterpriseAssignments, {
      fields: [enterpriseAssignmentSubmissions.assignmentId],
      references: [enterpriseAssignments.id],
    }),
    student: one(members, {
      fields: [enterpriseAssignmentSubmissions.studentMemberId],
      references: [members.id],
    }),
    reviewer: one(members, {
      fields: [enterpriseAssignmentSubmissions.reviewerMemberId],
      references: [members.id],
    }),
  })
);

export const enterpriseChallengesRelations = relations(enterpriseChallenges, ({ one, many }) => ({
  school: one(enterpriseSchools, {
    fields: [enterpriseChallenges.schoolId],
    references: [enterpriseSchools.id],
  }),
  creator: one(members, {
    fields: [enterpriseChallenges.createdByMemberId],
    references: [members.id],
  }),
  participations: many(enterpriseChallengeParticipations),
}));

export const enterpriseChallengeParticipationsRelations = relations(
  enterpriseChallengeParticipations,
  ({ one }) => ({
    challenge: one(enterpriseChallenges, {
      fields: [enterpriseChallengeParticipations.challengeId],
      references: [enterpriseChallenges.id],
    }),
    classroom: one(enterpriseClassrooms, {
      fields: [enterpriseChallengeParticipations.classroomId],
      references: [enterpriseClassrooms.id],
    }),
    student: one(members, {
      fields: [enterpriseChallengeParticipations.studentMemberId],
      references: [members.id],
    }),
  })
);

export const enterpriseBulkImportsRelations = relations(enterpriseBulkImports, ({ one }) => ({
  school: one(enterpriseSchools, {
    fields: [enterpriseBulkImports.schoolId],
    references: [enterpriseSchools.id],
  }),
  classroom: one(enterpriseClassrooms, {
    fields: [enterpriseBulkImports.classroomId],
    references: [enterpriseClassrooms.id],
  }),
  importedBy: one(members, {
    fields: [enterpriseBulkImports.importedByMemberId],
    references: [members.id],
  }),
}));

export const enterpriseLmsIntegrationsRelations = relations(
  enterpriseLmsIntegrations,
  ({ one }) => ({
    school: one(enterpriseSchools, {
      fields: [enterpriseLmsIntegrations.schoolId],
      references: [enterpriseSchools.id],
    }),
  })
);

export const enterpriseParentVisibilityRelations = relations(
  enterpriseParentVisibility,
  ({ one }) => ({
    school: one(enterpriseSchools, {
      fields: [enterpriseParentVisibility.schoolId],
      references: [enterpriseSchools.id],
    }),
    student: one(members, {
      fields: [enterpriseParentVisibility.studentMemberId],
      references: [members.id],
    }),
    updatedBy: one(members, {
      fields: [enterpriseParentVisibility.updatedByMemberId],
      references: [members.id],
    }),
  })
);

export const enterpriseAdminAuditsRelations = relations(enterpriseAdminAudits, ({ one }) => ({
  school: one(enterpriseSchools, {
    fields: [enterpriseAdminAudits.schoolId],
    references: [enterpriseSchools.id],
  }),
  actor: one(members, {
    fields: [enterpriseAdminAudits.actorMemberId],
    references: [members.id],
  }),
}));
