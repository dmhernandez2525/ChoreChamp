import { FastifyInstance } from 'fastify';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../lib/db';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import {
  enterpriseAdminAudits,
  enterpriseAssignmentSubmissions,
  enterpriseAssignments,
  enterpriseBulkImports,
  enterpriseChallengeParticipations,
  enterpriseChallenges,
  enterpriseClassrooms,
  enterpriseClassroomStudents,
  enterpriseDistricts,
  enterpriseLmsIntegrations,
  enterpriseParentVisibility,
  enterpriseSchools,
  members,
} from '@chorechamp/database';
import type { EnterpriseLmsProvider, EnterpriseVisibilityMode } from '@chorechamp/types';

type MemberRecord = typeof members.$inferSelect;
type SchoolRecord = typeof enterpriseSchools.$inferSelect;
type ClassroomRecord = typeof enterpriseClassrooms.$inferSelect;

type CsvImportRow = {
  memberId: string | null;
  name: string | null;
  role: 'child' | 'teen';
  studentNumber: string | null;
  visibilityModeOverride: EnterpriseVisibilityMode | null;
};

const schoolTypeValues = [
  'elementary',
  'middle',
  'high',
  'k12',
  'district_program',
  'other',
] as const;
const lmsProviderValues = ['canvas', 'google_classroom', 'clever'] as const;
const visibilityModeValues = ['private', 'summary', 'full'] as const;
const assignmentTypeValues = ['chore', 'task', 'homework'] as const;
const challengeTypeValues = ['classroom', 'school', 'district'] as const;
const challengeStatusValues = ['scheduled', 'active', 'completed', 'canceled'] as const;

const createDistrictSchema = z.object({
  name: z.string().min(1).max(160),
  code: z.string().max(32).optional(),
  contactEmail: z.string().email().max(255).optional(),
  contactPhone: z.string().max(50).optional(),
});

const createSchoolSchema = z.object({
  districtId: z.string().uuid().optional(),
  name: z.string().min(1).max(180),
  schoolType: z.enum(schoolTypeValues),
  timezone: z.string().min(1).max(50).optional(),
  brandingName: z.string().max(180).optional(),
  brandingLogoUrl: z.string().url().optional(),
  brandingPrimaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  ferpaModeEnabled: z.boolean().optional(),
  coppaModeEnabled: z.boolean().optional(),
  parentVisibilityDefault: z.enum(visibilityModeValues).optional(),
});

const updateSchoolSchema = createSchoolSchema.partial().extend({
  brandingName: z.string().max(180).nullable().optional(),
  brandingLogoUrl: z.string().url().nullable().optional(),
  brandingPrimaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

const createClassroomSchema = z.object({
  name: z.string().min(1).max(120),
  gradeLevel: z.string().min(1).max(40),
  section: z.string().max(20).optional(),
  subject: z.string().max(80).optional(),
  teacherMemberId: z.string().uuid().optional(),
  externalClassId: z.string().max(120).optional(),
  lmsProvider: z.enum(lmsProviderValues).optional(),
  lmsCourseId: z.string().max(120).optional(),
});

const addStudentSchema = z.object({
  memberId: z.string().uuid().optional(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(['child', 'teen']).optional(),
  studentNumber: z.string().max(60).optional(),
  visibilityModeOverride: z.enum(visibilityModeValues).optional(),
});

const importStudentsSchema = z.object({
  sourceFileName: z.string().max(255).optional(),
  csv: z.string().min(1),
});

const createAssignmentSchema = z.object({
  title: z.string().min(1).max(180),
  description: z.string().max(2000).optional(),
  assignmentType: z.enum(assignmentTypeValues),
  dueAt: z.string().datetime().optional(),
  points: z.number().int().min(1).max(2000).optional(),
  requiresProof: z.boolean().optional(),
});

const submitAssignmentSchema = z.object({
  studentMemberId: z.string().uuid().optional(),
  evidenceNote: z.string().max(2000).optional(),
});

const reviewSubmissionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  score: z.number().int().min(0).max(2000).optional(),
  feedback: z.string().max(2000).optional(),
});

const createChallengeSchema = z.object({
  title: z.string().min(1).max(180),
  description: z.string().max(2000).optional(),
  challengeType: z.enum(challengeTypeValues),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  rewardPoints: z.number().int().min(1).max(5000).optional(),
  status: z.enum(challengeStatusValues).optional(),
});

const addChallengeParticipationSchema = z.object({
  classroomId: z.string().uuid().optional(),
  studentMemberId: z.string().uuid().optional(),
  progress: z.number().min(0).max(100).optional(),
  rank: z.number().int().min(1).max(9999).optional(),
});

const configureLmsSchema = z.object({
  syncEnabled: z.boolean(),
  externalTenantId: z.string().max(180).optional(),
  clientId: z.string().max(180).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

const setVisibilitySchema = z.object({
  visibilityMode: z.enum(visibilityModeValues),
  allowTeacherMessages: z.boolean().optional(),
  allowChallengeVisibility: z.boolean().optional(),
});

const reportQuerySchema = z.object({
  format: z.enum(['pdf', 'excel']).default('pdf'),
});

const studentPalette = [
  '#3B82F6',
  '#22C55E',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#EF4444',
  '#14B8A6',
];

function normalizeCsvCell(value: string): string {
  return value
    .trim()
    .replace(/^"(.*)"$/, '$1')
    .replace(/""/g, '"');
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(normalizeCsvCell(current));
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(normalizeCsvCell(current));
  return cells;
}

function parseStudentsCsv(csv: string): {
  rows: CsvImportRow[];
  errors: Array<{ row: number; message: string }>;
} {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 1, message: 'CSV must include a header and at least one data row.' }],
    };
  }

  const headerCells = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const indexByHeader = new Map<string, number>();
  headerCells.forEach((header, index) => {
    indexByHeader.set(header, index);
  });

  const rows: CsvImportRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const cells = parseCsvLine(lines[rowIndex]);
    const memberId =
      cells[indexByHeader.get('memberid') ?? -1] ??
      cells[indexByHeader.get('member_id') ?? -1] ??
      '';
    const name = cells[indexByHeader.get('name') ?? -1] ?? '';
    const roleRaw = (cells[indexByHeader.get('role') ?? -1] ?? 'child').toLowerCase();
    const studentNumber =
      cells[indexByHeader.get('studentnumber') ?? -1] ??
      cells[indexByHeader.get('student_number') ?? -1] ??
      '';
    const visibilityRaw = (
      cells[indexByHeader.get('visibilitymode') ?? -1] ??
      cells[indexByHeader.get('visibility_mode') ?? -1] ??
      ''
    ).toLowerCase();

    const role = roleRaw === 'teen' ? 'teen' : roleRaw === 'child' ? 'child' : null;
    if (!role) {
      errors.push({ row: rowIndex + 1, message: 'Role must be child or teen.' });
      continue;
    }

    const visibilityMode = visibilityRaw.length
      ? (visibilityModeValues.find((value) => value === visibilityRaw) ?? null)
      : null;

    if (visibilityRaw.length > 0 && !visibilityMode) {
      errors.push({ row: rowIndex + 1, message: 'Invalid visibility mode.' });
      continue;
    }

    if (!memberId.trim() && !name.trim()) {
      errors.push({ row: rowIndex + 1, message: 'Either memberId or name is required.' });
      continue;
    }

    rows.push({
      memberId: memberId.trim() || null,
      name: name.trim() || null,
      role,
      studentNumber: studentNumber.trim() || null,
      visibilityModeOverride: visibilityMode,
    });
  }

  return { rows, errors };
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdfBuffer(lines: string[]): Buffer {
  const normalized = lines.map((line) => line.trim()).filter((line) => line.length > 0);
  const contentParts = ['BT', '/F1 11 Tf', '50 760 Td'];

  normalized.forEach((line, index) => {
    const clipped = line.length > 110 ? `${line.slice(0, 107)}...` : line;
    const escaped = escapePdfText(clipped);
    if (index === 0) {
      contentParts.push(`(${escaped}) Tj`);
    } else {
      contentParts.push(`0 -14 Td (${escaped}) Tj`);
    }
  });

  contentParts.push('ET');
  const contentStream = contentParts.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += object;
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index < offsets.length; index += 1) {
    const offset = offsets[index].toString().padStart(10, '0');
    pdf += `${offset} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function percent(approved: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((approved / total) * 100).toFixed(1));
}

async function getMembershipByUser(
  userId: string,
  householdId: string
): Promise<MemberRecord | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.householdId, householdId), eq(members.userId, userId)));
  return membership ?? null;
}

async function getMemberById(memberId: string, householdId: string): Promise<MemberRecord | null> {
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.id, memberId), eq(members.householdId, householdId)));
  return member ?? null;
}

async function getSchoolById(schoolId: string, householdId: string): Promise<SchoolRecord | null> {
  const [school] = await db
    .select()
    .from(enterpriseSchools)
    .where(and(eq(enterpriseSchools.id, schoolId), eq(enterpriseSchools.householdId, householdId)));
  return school ?? null;
}

async function getClassroomById(
  classroomId: string,
  householdId: string
): Promise<ClassroomRecord | null> {
  const [classroom] = await db
    .select()
    .from(enterpriseClassrooms)
    .where(
      and(
        eq(enterpriseClassrooms.id, classroomId),
        eq(enterpriseClassrooms.householdId, householdId)
      )
    );
  return classroom ?? null;
}

function requireParentAccess(membership: MemberRecord): boolean {
  return membership.role === 'parent';
}

async function logAuditEvent(input: {
  householdId: string;
  schoolId?: string | null;
  actorMemberId?: string | null;
  eventType: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(enterpriseAdminAudits).values({
    householdId: input.householdId,
    schoolId: input.schoolId ?? null,
    actorMemberId: input.actorMemberId ?? null,
    eventType: input.eventType,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? null,
    createdAt: new Date(),
  });
}

async function ensureParentVisibility(
  householdId: string,
  school: SchoolRecord,
  studentMemberId: string,
  updatedByMemberId: string,
  visibilityOverride?: EnterpriseVisibilityMode | null
) {
  const [existing] = await db
    .select()
    .from(enterpriseParentVisibility)
    .where(
      and(
        eq(enterpriseParentVisibility.schoolId, school.id),
        eq(enterpriseParentVisibility.studentMemberId, studentMemberId),
        eq(enterpriseParentVisibility.householdId, householdId)
      )
    );

  if (existing) {
    return;
  }

  const mode: EnterpriseVisibilityMode =
    visibilityOverride ?? (school.parentVisibilityDefault as EnterpriseVisibilityMode);

  await db.insert(enterpriseParentVisibility).values({
    householdId,
    schoolId: school.id,
    studentMemberId,
    visibilityMode: mode,
    allowTeacherMessages: true,
    allowChallengeVisibility: true,
    updatedByMemberId,
    updatedAt: new Date(),
  });
}

async function buildSchoolAnalytics(householdId: string, schoolId: string) {
  const [classroomCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enterpriseClassrooms)
    .where(
      and(
        eq(enterpriseClassrooms.householdId, householdId),
        eq(enterpriseClassrooms.schoolId, schoolId)
      )
    );

  const [studentCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enterpriseClassroomStudents)
    .where(
      and(
        eq(enterpriseClassroomStudents.householdId, householdId),
        eq(enterpriseClassroomStudents.schoolId, schoolId),
        eq(enterpriseClassroomStudents.isActive, true)
      )
    );

  const assignments = await db
    .select({ id: enterpriseAssignments.id })
    .from(enterpriseAssignments)
    .where(
      and(
        eq(enterpriseAssignments.householdId, householdId),
        eq(enterpriseAssignments.schoolId, schoolId)
      )
    );

  const assignmentIds = assignments.map((assignment) => assignment.id);

  let submissionCount = 0;
  let approvedCount = 0;

  if (assignmentIds.length > 0) {
    const [submissionCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enterpriseAssignmentSubmissions)
      .where(
        and(
          eq(enterpriseAssignmentSubmissions.householdId, householdId),
          inArray(enterpriseAssignmentSubmissions.assignmentId, assignmentIds)
        )
      );

    const [approvedCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enterpriseAssignmentSubmissions)
      .where(
        and(
          eq(enterpriseAssignmentSubmissions.householdId, householdId),
          inArray(enterpriseAssignmentSubmissions.assignmentId, assignmentIds),
          eq(enterpriseAssignmentSubmissions.status, 'approved')
        )
      );

    submissionCount = submissionCountResult?.count ?? 0;
    approvedCount = approvedCountResult?.count ?? 0;
  }

  const [challengeCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enterpriseChallenges)
    .where(
      and(
        eq(enterpriseChallenges.householdId, householdId),
        eq(enterpriseChallenges.schoolId, schoolId)
      )
    );

  const [activeChallengeCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enterpriseChallenges)
    .where(
      and(
        eq(enterpriseChallenges.householdId, householdId),
        eq(enterpriseChallenges.schoolId, schoolId),
        eq(enterpriseChallenges.status, 'active')
      )
    );

  const providers = await db
    .select({ provider: enterpriseLmsIntegrations.provider })
    .from(enterpriseLmsIntegrations)
    .where(
      and(
        eq(enterpriseLmsIntegrations.householdId, householdId),
        eq(enterpriseLmsIntegrations.schoolId, schoolId),
        eq(enterpriseLmsIntegrations.syncEnabled, true)
      )
    );

  return {
    schoolId,
    classroomCount: classroomCountResult?.count ?? 0,
    studentCount: studentCountResult?.count ?? 0,
    assignmentCount: assignmentIds.length,
    submissionCount,
    approvalRate: percent(approvedCount, submissionCount),
    challengeCount: challengeCountResult?.count ?? 0,
    activeChallengeCount: activeChallengeCountResult?.count ?? 0,
    lmsConnectedProviders: providers.map((provider) => provider.provider as EnterpriseLmsProvider),
  };
}

async function resolveOrCreateStudentMember(
  householdId: string,
  row: CsvImportRow,
  rowIndex: number
): Promise<{ member: MemberRecord | null; error?: string }> {
  if (row.memberId) {
    const member = await getMemberById(row.memberId, householdId);
    if (!member) {
      return { member: null, error: `Row ${rowIndex}: memberId was not found.` };
    }
    if (member.role !== 'child' && member.role !== 'teen') {
      return { member: null, error: `Row ${rowIndex}: member role must be child or teen.` };
    }
    return { member };
  }

  if (!row.name) {
    return { member: null, error: `Row ${rowIndex}: name is required when memberId is missing.` };
  }

  const [member] = await db
    .insert(members)
    .values({
      householdId,
      userId: null,
      name: row.name,
      role: row.role,
      color: studentPalette[rowIndex % studentPalette.length],
      avatarUrl: null,
      birthYear: null,
      pointsCurrent: 0,
      pointsLifetime: 0,
      streakCurrent: 0,
      streakLongest: 0,
      streakLastCompletedDate: null,
      streakFreezesAvailable: 1,
      streakFreezesUsed: 0,
      badges: [],
      canRedeemRewards: true,
      requiresApproval: true,
      caregiverPermissions: null,
      linkedMemberId: null,
      crossHouseholdSettings: null,
      lastReminderAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return { member };
}

async function buildClassroomDashboard(classroom: ClassroomRecord) {
  const students = await db
    .select()
    .from(enterpriseClassroomStudents)
    .where(
      and(
        eq(enterpriseClassroomStudents.householdId, classroom.householdId),
        eq(enterpriseClassroomStudents.classroomId, classroom.id),
        eq(enterpriseClassroomStudents.isActive, true)
      )
    );

  const assignments = await db
    .select()
    .from(enterpriseAssignments)
    .where(
      and(
        eq(enterpriseAssignments.householdId, classroom.householdId),
        eq(enterpriseAssignments.classroomId, classroom.id),
        eq(enterpriseAssignments.status, 'active')
      )
    );

  const assignmentIds = assignments.map((assignment) => assignment.id);
  const submissions = assignmentIds.length
    ? await db
        .select()
        .from(enterpriseAssignmentSubmissions)
        .where(
          and(
            eq(enterpriseAssignmentSubmissions.householdId, classroom.householdId),
            inArray(enterpriseAssignmentSubmissions.assignmentId, assignmentIds)
          )
        )
    : [];

  const memberIds = Array.from(
    new Set(submissions.map((submission) => submission.studentMemberId))
  );
  const studentMembers = memberIds.length
    ? await db
        .select({ id: members.id, name: members.name })
        .from(members)
        .where(and(eq(members.householdId, classroom.householdId), inArray(members.id, memberIds)))
    : [];

  const nameByMemberId = new Map(studentMembers.map((member) => [member.id, member.name]));
  const statsByMember = new Map<
    string,
    { approved: number; total: number; scoreTotal: number; scoreCount: number }
  >();

  for (const submission of submissions) {
    const current = statsByMember.get(submission.studentMemberId) ?? {
      approved: 0,
      total: 0,
      scoreTotal: 0,
      scoreCount: 0,
    };

    current.total += 1;
    if (submission.status === 'approved') {
      current.approved += 1;
    }
    if (typeof submission.score === 'number') {
      current.scoreTotal += submission.score;
      current.scoreCount += 1;
    }

    statsByMember.set(submission.studentMemberId, current);
  }

  const topStudents = Array.from(statsByMember.entries())
    .map(([memberId, values]) => ({
      memberId,
      memberName: nameByMemberId.get(memberId) ?? 'Unknown Student',
      submissionsApproved: values.approved,
      submissionsTotal: values.total,
      averageScore:
        values.scoreCount > 0 ? Number((values.scoreTotal / values.scoreCount).toFixed(1)) : null,
    }))
    .sort((left, right) => right.submissionsApproved - left.submissionsApproved)
    .slice(0, 5);

  const submittedAssignments = submissions.filter(
    (submission) => submission.status === 'submitted'
  ).length;
  const approvedAssignments = submissions.filter(
    (submission) => submission.status === 'approved'
  ).length;

  return {
    classroom,
    studentCount: students.length,
    activeAssignments: assignments.length,
    submittedAssignments,
    approvedAssignments,
    completionRate: percent(approvedAssignments, submissions.length),
    topStudents,
  };
}

export async function enterpriseSchoolRoutes(fastify: FastifyInstance) {
  fastify.get('/enterprise/overview', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembershipByUser(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
    }

    if (!requireParentAccess(membership)) {
      return reply
        .status(403)
        .send({ error: 'Forbidden', message: 'Only parents can access the enterprise overview.' });
    }

    const districts = await db
      .select()
      .from(enterpriseDistricts)
      .where(eq(enterpriseDistricts.householdId, householdId))
      .orderBy(enterpriseDistricts.name);

    const schools = await db
      .select()
      .from(enterpriseSchools)
      .where(eq(enterpriseSchools.householdId, householdId))
      .orderBy(enterpriseSchools.name);

    const schoolAnalytics = await Promise.all(
      schools.map((school) => buildSchoolAnalytics(householdId, school.id))
    );

    const districtOverviews = await Promise.all(
      districts.map(async (district) => {
        const districtSchools = schools.filter((school) => school.districtId === district.id);
        const analyticsForDistrict = schoolAnalytics.filter((analytics) =>
          districtSchools.some((school) => school.id === analytics.schoolId)
        );

        const studentCount = analyticsForDistrict.reduce(
          (sum, analytics) => sum + analytics.studentCount,
          0
        );
        const classroomCount = analyticsForDistrict.reduce(
          (sum, analytics) => sum + analytics.classroomCount,
          0
        );
        const assignmentCount = analyticsForDistrict.reduce(
          (sum, analytics) => sum + analytics.assignmentCount,
          0
        );
        const submissionCount = analyticsForDistrict.reduce(
          (sum, analytics) => sum + analytics.submissionCount,
          0
        );
        const approvedSubmissions = Math.round(
          analyticsForDistrict.reduce(
            (sum, analytics) => sum + (analytics.submissionCount * analytics.approvalRate) / 100,
            0
          )
        );

        return {
          district,
          schoolCount: districtSchools.length,
          classroomCount,
          studentCount,
          assignmentCount,
          approvalRate: percent(approvedSubmissions, submissionCount),
        };
      })
    );

    const recentImports = await db
      .select()
      .from(enterpriseBulkImports)
      .where(eq(enterpriseBulkImports.householdId, householdId))
      .orderBy(desc(enterpriseBulkImports.importedAt))
      .limit(10);

    const lmsIntegrations = await db
      .select()
      .from(enterpriseLmsIntegrations)
      .where(eq(enterpriseLmsIntegrations.householdId, householdId))
      .orderBy(desc(enterpriseLmsIntegrations.updatedAt));

    const latestAudits = await db
      .select()
      .from(enterpriseAdminAudits)
      .where(eq(enterpriseAdminAudits.householdId, householdId))
      .orderBy(desc(enterpriseAdminAudits.createdAt))
      .limit(25);

    return {
      districts: districtOverviews,
      schools,
      schoolAnalytics,
      recentImports,
      lmsIntegrations,
      latestAudits,
    };
  });

  fastify.get('/enterprise/districts', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembershipByUser(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
    }

    const districts = await db
      .select()
      .from(enterpriseDistricts)
      .where(eq(enterpriseDistricts.householdId, householdId))
      .orderBy(enterpriseDistricts.name);

    return { districts };
  });

  fastify.post('/enterprise/districts', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createDistrictSchema.parse(request.body);

    const membership = await getMembershipByUser(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
    }

    if (!requireParentAccess(membership)) {
      return reply
        .status(403)
        .send({ error: 'Forbidden', message: 'Only parents can create districts.' });
    }

    const [district] = await db
      .insert(enterpriseDistricts)
      .values({
        householdId,
        name: body.name,
        code: body.code ?? null,
        contactEmail: body.contactEmail ?? null,
        contactPhone: body.contactPhone ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logAuditEvent({
      householdId,
      actorMemberId: membership.id,
      eventType: 'district_created',
      targetType: 'district',
      targetId: district.id,
      metadata: { name: district.name, code: district.code },
    });

    return reply.status(201).send(district);
  });

  fastify.get('/enterprise/schools', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembershipByUser(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
    }

    const schools = await db
      .select()
      .from(enterpriseSchools)
      .where(eq(enterpriseSchools.householdId, householdId))
      .orderBy(enterpriseSchools.name);

    return { schools };
  });

  fastify.post('/enterprise/schools', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createSchoolSchema.parse(request.body);

    const membership = await getMembershipByUser(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
    }

    if (!requireParentAccess(membership)) {
      return reply
        .status(403)
        .send({ error: 'Forbidden', message: 'Only parents can create schools.' });
    }

    if (body.districtId) {
      const [district] = await db
        .select({ id: enterpriseDistricts.id })
        .from(enterpriseDistricts)
        .where(
          and(
            eq(enterpriseDistricts.id, body.districtId),
            eq(enterpriseDistricts.householdId, householdId)
          )
        );

      if (!district) {
        return reply.status(404).send({ error: 'Not Found', message: 'District not found.' });
      }
    }

    const [school] = await db
      .insert(enterpriseSchools)
      .values({
        householdId,
        districtId: body.districtId ?? null,
        name: body.name,
        schoolType: body.schoolType,
        timezone: body.timezone ?? 'America/New_York',
        brandingName: body.brandingName ?? null,
        brandingLogoUrl: body.brandingLogoUrl ?? null,
        brandingPrimaryColor: body.brandingPrimaryColor ?? null,
        ferpaModeEnabled: body.ferpaModeEnabled ?? true,
        coppaModeEnabled: body.coppaModeEnabled ?? true,
        parentVisibilityDefault: body.parentVisibilityDefault ?? 'summary',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await logAuditEvent({
      householdId,
      schoolId: school.id,
      actorMemberId: membership.id,
      eventType: 'school_created',
      targetType: 'school',
      targetId: school.id,
      metadata: {
        name: school.name,
        schoolType: school.schoolType,
        ferpaModeEnabled: school.ferpaModeEnabled,
        coppaModeEnabled: school.coppaModeEnabled,
      },
    });

    return reply.status(201).send(school);
  });

  fastify.patch(
    '/enterprise/schools/:schoolId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };
      const body = updateSchoolSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      if (!requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can update schools.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const [updated] = await db
        .update(enterpriseSchools)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(
          and(eq(enterpriseSchools.id, schoolId), eq(enterpriseSchools.householdId, householdId))
        )
        .returning();

      await logAuditEvent({
        householdId,
        schoolId,
        actorMemberId: membership.id,
        eventType: 'school_updated',
        targetType: 'school',
        targetId: schoolId,
        metadata: body,
      });

      return updated;
    }
  );

  fastify.post(
    '/enterprise/schools/:schoolId/classrooms',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };
      const body = createClassroomSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      if (!requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can create classrooms.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      if (body.teacherMemberId) {
        const teacher = await getMemberById(body.teacherMemberId, householdId);
        if (!teacher) {
          return reply
            .status(404)
            .send({ error: 'Not Found', message: 'Teacher member not found.' });
        }
      }

      const [classroom] = await db
        .insert(enterpriseClassrooms)
        .values({
          householdId,
          schoolId,
          name: body.name,
          gradeLevel: body.gradeLevel,
          section: body.section ?? null,
          subject: body.subject ?? null,
          teacherMemberId: body.teacherMemberId ?? null,
          externalClassId: body.externalClassId ?? null,
          lmsProvider: body.lmsProvider ?? null,
          lmsCourseId: body.lmsCourseId ?? null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await logAuditEvent({
        householdId,
        schoolId,
        actorMemberId: membership.id,
        eventType: 'classroom_created',
        targetType: 'classroom',
        targetId: classroom.id,
        metadata: { name: classroom.name, gradeLevel: classroom.gradeLevel },
      });

      return reply.status(201).send(classroom);
    }
  );

  fastify.get(
    '/enterprise/schools/:schoolId/classrooms',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const classrooms = await db
        .select()
        .from(enterpriseClassrooms)
        .where(
          and(
            eq(enterpriseClassrooms.householdId, householdId),
            eq(enterpriseClassrooms.schoolId, schoolId)
          )
        )
        .orderBy(enterpriseClassrooms.name);

      return { classrooms };
    }
  );

  fastify.post(
    '/enterprise/classrooms/:classroomId/students',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, classroomId } = request.params as {
        householdId: string;
        classroomId: string;
      };
      const body = addStudentSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      if (!requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can add students.' });
      }

      const classroom = await getClassroomById(classroomId, householdId);
      if (!classroom) {
        return reply.status(404).send({ error: 'Not Found', message: 'Classroom not found.' });
      }

      const school = await getSchoolById(classroom.schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const resolved = await resolveOrCreateStudentMember(
        householdId,
        {
          memberId: body.memberId ?? null,
          name: body.name ?? null,
          role: body.role ?? 'child',
          studentNumber: body.studentNumber ?? null,
          visibilityModeOverride: body.visibilityModeOverride ?? null,
        },
        1
      );

      if (!resolved.member) {
        return reply
          .status(400)
          .send({
            error: 'Bad Request',
            message: resolved.error ?? 'Unable to resolve student member.',
          });
      }

      const [existingLink] = await db
        .select({ id: enterpriseClassroomStudents.id })
        .from(enterpriseClassroomStudents)
        .where(
          and(
            eq(enterpriseClassroomStudents.householdId, householdId),
            eq(enterpriseClassroomStudents.classroomId, classroomId),
            eq(enterpriseClassroomStudents.memberId, resolved.member.id)
          )
        );

      if (existingLink) {
        return reply
          .status(409)
          .send({ error: 'Conflict', message: 'Student is already in this classroom.' });
      }

      const [enrollment] = await db
        .insert(enterpriseClassroomStudents)
        .values({
          householdId,
          schoolId: classroom.schoolId,
          classroomId,
          memberId: resolved.member.id,
          studentNumber: body.studentNumber ?? null,
          visibilityModeOverride: body.visibilityModeOverride ?? null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await ensureParentVisibility(
        householdId,
        school,
        resolved.member.id,
        membership.id,
        body.visibilityModeOverride ?? null
      );

      await logAuditEvent({
        householdId,
        schoolId: classroom.schoolId,
        actorMemberId: membership.id,
        eventType: 'classroom_student_added',
        targetType: 'classroom_student',
        targetId: enrollment.id,
        metadata: { classroomId, memberId: resolved.member.id },
      });

      return reply.status(201).send(enrollment);
    }
  );

  fastify.post(
    '/enterprise/classrooms/:classroomId/students/import',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, classroomId } = request.params as {
        householdId: string;
        classroomId: string;
      };
      const body = importStudentsSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      if (!requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can import students.' });
      }

      const classroom = await getClassroomById(classroomId, householdId);
      if (!classroom) {
        return reply.status(404).send({ error: 'Not Found', message: 'Classroom not found.' });
      }

      const school = await getSchoolById(classroom.schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const parsed = parseStudentsCsv(body.csv);
      const importErrors = [...parsed.errors];
      let createdStudentMembers = 0;
      let attachedStudents = 0;

      for (let rowIndex = 0; rowIndex < parsed.rows.length; rowIndex += 1) {
        const row = parsed.rows[rowIndex];
        const resolved = await resolveOrCreateStudentMember(householdId, row, rowIndex + 2);
        if (!resolved.member) {
          importErrors.push({
            row: rowIndex + 2,
            message: resolved.error ?? 'Unable to resolve student member.',
          });
          continue;
        }

        if (!row.memberId) {
          createdStudentMembers += 1;
        }

        const [existingEnrollment] = await db
          .select({ id: enterpriseClassroomStudents.id })
          .from(enterpriseClassroomStudents)
          .where(
            and(
              eq(enterpriseClassroomStudents.householdId, householdId),
              eq(enterpriseClassroomStudents.classroomId, classroomId),
              eq(enterpriseClassroomStudents.memberId, resolved.member.id)
            )
          );

        if (!existingEnrollment) {
          await db.insert(enterpriseClassroomStudents).values({
            householdId,
            schoolId: classroom.schoolId,
            classroomId,
            memberId: resolved.member.id,
            studentNumber: row.studentNumber,
            visibilityModeOverride: row.visibilityModeOverride,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          attachedStudents += 1;
        }

        await ensureParentVisibility(
          householdId,
          school,
          resolved.member.id,
          membership.id,
          row.visibilityModeOverride
        );
      }

      const [importLog] = await db
        .insert(enterpriseBulkImports)
        .values({
          householdId,
          schoolId: classroom.schoolId,
          classroomId,
          importType: 'students',
          sourceFileName: body.sourceFileName ?? null,
          rowCount: parsed.rows.length,
          successCount: attachedStudents,
          errorCount: importErrors.length,
          errors: importErrors,
          importedByMemberId: membership.id,
          importedAt: new Date(),
        })
        .returning();

      await logAuditEvent({
        householdId,
        schoolId: classroom.schoolId,
        actorMemberId: membership.id,
        eventType: 'classroom_students_imported',
        targetType: 'bulk_import',
        targetId: importLog.id,
        metadata: {
          classroomId,
          rowCount: parsed.rows.length,
          successCount: attachedStudents,
          errorCount: importErrors.length,
        },
      });

      return reply.status(201).send({
        importLog,
        createdStudentMembers,
        attachedStudents,
        skippedRows: importErrors.length,
      });
    }
  );

  fastify.get(
    '/enterprise/classrooms/:classroomId/students',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, classroomId } = request.params as {
        householdId: string;
        classroomId: string;
      };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      const classroom = await getClassroomById(classroomId, householdId);
      if (!classroom) {
        return reply.status(404).send({ error: 'Not Found', message: 'Classroom not found.' });
      }

      const enrollments = await db
        .select()
        .from(enterpriseClassroomStudents)
        .where(
          and(
            eq(enterpriseClassroomStudents.householdId, householdId),
            eq(enterpriseClassroomStudents.classroomId, classroomId),
            eq(enterpriseClassroomStudents.isActive, true)
          )
        )
        .orderBy(enterpriseClassroomStudents.createdAt);

      const memberIds = enrollments.map((enrollment) => enrollment.memberId);
      const rosterMembers = memberIds.length
        ? await db
            .select({ id: members.id, name: members.name, role: members.role })
            .from(members)
            .where(and(eq(members.householdId, householdId), inArray(members.id, memberIds)))
        : [];

      const memberById = new Map(rosterMembers.map((member) => [member.id, member]));

      const students = enrollments
        .filter(
          (enrollment) => requireParentAccess(membership) || enrollment.memberId === membership.id
        )
        .map((enrollment) => {
          const member = memberById.get(enrollment.memberId);
          return {
            ...enrollment,
            memberName: member?.name ?? 'Unknown Student',
            memberRole: (member?.role ?? 'child') as
              | 'parent'
              | 'child'
              | 'teen'
              | 'viewer'
              | 'caregiver',
          };
        });

      return { students };
    }
  );

  fastify.get(
    '/enterprise/classrooms/:classroomId/students/export',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, classroomId } = request.params as {
        householdId: string;
        classroomId: string;
      };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership || !requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can export students.' });
      }

      const classroom = await getClassroomById(classroomId, householdId);
      if (!classroom) {
        return reply.status(404).send({ error: 'Not Found', message: 'Classroom not found.' });
      }

      const enrollments = await db
        .select()
        .from(enterpriseClassroomStudents)
        .where(
          and(
            eq(enterpriseClassroomStudents.householdId, householdId),
            eq(enterpriseClassroomStudents.classroomId, classroomId)
          )
        )
        .orderBy(enterpriseClassroomStudents.createdAt);

      const memberIds = enrollments.map((enrollment) => enrollment.memberId);
      const rosterMembers = memberIds.length
        ? await db
            .select({ id: members.id, name: members.name, role: members.role })
            .from(members)
            .where(and(eq(members.householdId, householdId), inArray(members.id, memberIds)))
        : [];

      const memberById = new Map(rosterMembers.map((member) => [member.id, member]));
      const csvRows = [
        ['memberId', 'name', 'role', 'studentNumber', 'visibilityMode', 'isActive'].join(','),
        ...enrollments.map((enrollment) => {
          const rosterMember = memberById.get(enrollment.memberId);
          return [
            csvEscape(enrollment.memberId),
            csvEscape(rosterMember?.name ?? ''),
            csvEscape(rosterMember?.role ?? ''),
            csvEscape(enrollment.studentNumber ?? ''),
            csvEscape(enrollment.visibilityModeOverride ?? ''),
            csvEscape(enrollment.isActive ? 'true' : 'false'),
          ].join(',');
        }),
      ];

      const csvContent = csvRows.join('\n');
      const fileName = `classroom-${classroom.id}-students.csv`;

      return {
        format: 'excel',
        fileName,
        mimeType: 'text/csv',
        contentBase64: Buffer.from(csvContent, 'utf8').toString('base64'),
        generatedAt: new Date(),
      };
    }
  );

  fastify.post(
    '/enterprise/classrooms/:classroomId/assignments',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, classroomId } = request.params as {
        householdId: string;
        classroomId: string;
      };
      const body = createAssignmentSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      if (!requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can create assignments.' });
      }

      const classroom = await getClassroomById(classroomId, householdId);
      if (!classroom) {
        return reply.status(404).send({ error: 'Not Found', message: 'Classroom not found.' });
      }

      const [assignment] = await db
        .insert(enterpriseAssignments)
        .values({
          householdId,
          schoolId: classroom.schoolId,
          classroomId,
          title: body.title,
          description: body.description ?? null,
          assignmentType: body.assignmentType,
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
          points: body.points ?? 25,
          requiresProof: body.requiresProof ?? false,
          createdByMemberId: membership.id,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const students = await db
        .select({ memberId: enterpriseClassroomStudents.memberId })
        .from(enterpriseClassroomStudents)
        .where(
          and(
            eq(enterpriseClassroomStudents.householdId, householdId),
            eq(enterpriseClassroomStudents.classroomId, classroomId),
            eq(enterpriseClassroomStudents.isActive, true)
          )
        );

      if (students.length > 0) {
        await db.insert(enterpriseAssignmentSubmissions).values(
          students.map((student) => ({
            householdId,
            assignmentId: assignment.id,
            studentMemberId: student.memberId,
            status: 'assigned',
            evidenceNote: null,
            score: null,
            submittedAt: null,
            reviewedAt: null,
            reviewerMemberId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }

      await logAuditEvent({
        householdId,
        schoolId: classroom.schoolId,
        actorMemberId: membership.id,
        eventType: 'assignment_created',
        targetType: 'assignment',
        targetId: assignment.id,
        metadata: { classroomId, points: assignment.points, type: assignment.assignmentType },
      });

      return reply.status(201).send(assignment);
    }
  );

  fastify.get(
    '/enterprise/classrooms/:classroomId/assignments',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, classroomId } = request.params as {
        householdId: string;
        classroomId: string;
      };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      const classroom = await getClassroomById(classroomId, householdId);
      if (!classroom) {
        return reply.status(404).send({ error: 'Not Found', message: 'Classroom not found.' });
      }

      const assignments = await db
        .select()
        .from(enterpriseAssignments)
        .where(
          and(
            eq(enterpriseAssignments.householdId, householdId),
            eq(enterpriseAssignments.classroomId, classroomId)
          )
        )
        .orderBy(desc(enterpriseAssignments.createdAt));

      const assignmentIds = assignments.map((assignment) => assignment.id);
      const submissions = assignmentIds.length
        ? await db
            .select()
            .from(enterpriseAssignmentSubmissions)
            .where(
              and(
                eq(enterpriseAssignmentSubmissions.householdId, householdId),
                inArray(enterpriseAssignmentSubmissions.assignmentId, assignmentIds)
              )
            )
        : [];

      const submissionsByAssignment = new Map<string, typeof submissions>();
      for (const submission of submissions) {
        const current = submissionsByAssignment.get(submission.assignmentId) ?? [];
        if (requireParentAccess(membership) || submission.studentMemberId === membership.id) {
          current.push(submission);
          submissionsByAssignment.set(submission.assignmentId, current);
        }
      }

      return {
        assignments: assignments.map((assignment) => ({
          ...assignment,
          submissions: submissionsByAssignment.get(assignment.id) ?? [],
        })),
      };
    }
  );

  fastify.post(
    '/enterprise/assignments/:assignmentId/submit',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, assignmentId } = request.params as {
        householdId: string;
        assignmentId: string;
      };
      const body = submitAssignmentSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      const [assignment] = await db
        .select()
        .from(enterpriseAssignments)
        .where(
          and(
            eq(enterpriseAssignments.id, assignmentId),
            eq(enterpriseAssignments.householdId, householdId)
          )
        );

      if (!assignment) {
        return reply.status(404).send({ error: 'Not Found', message: 'Assignment not found.' });
      }

      const studentMemberId = body.studentMemberId ?? membership.id;

      if (!requireParentAccess(membership) && studentMemberId !== membership.id) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Cannot submit for another member.' });
      }

      const [submission] = await db
        .select()
        .from(enterpriseAssignmentSubmissions)
        .where(
          and(
            eq(enterpriseAssignmentSubmissions.householdId, householdId),
            eq(enterpriseAssignmentSubmissions.assignmentId, assignmentId),
            eq(enterpriseAssignmentSubmissions.studentMemberId, studentMemberId)
          )
        );

      if (!submission) {
        return reply
          .status(404)
          .send({ error: 'Not Found', message: 'Submission record not found for this student.' });
      }

      const [updated] = await db
        .update(enterpriseAssignmentSubmissions)
        .set({
          status: 'submitted',
          evidenceNote: body.evidenceNote ?? submission.evidenceNote,
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(enterpriseAssignmentSubmissions.id, submission.id))
        .returning();

      await logAuditEvent({
        householdId,
        schoolId: assignment.schoolId,
        actorMemberId: membership.id,
        eventType: 'assignment_submitted',
        targetType: 'submission',
        targetId: submission.id,
        metadata: { assignmentId, studentMemberId },
      });

      return updated;
    }
  );

  fastify.post(
    '/enterprise/submissions/:submissionId/review',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, submissionId } = request.params as {
        householdId: string;
        submissionId: string;
      };
      const body = reviewSubmissionSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      if (!requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can review submissions.' });
      }

      const [submission] = await db
        .select()
        .from(enterpriseAssignmentSubmissions)
        .where(
          and(
            eq(enterpriseAssignmentSubmissions.id, submissionId),
            eq(enterpriseAssignmentSubmissions.householdId, householdId)
          )
        );

      if (!submission) {
        return reply.status(404).send({ error: 'Not Found', message: 'Submission not found.' });
      }

      const [assignment] = await db
        .select()
        .from(enterpriseAssignments)
        .where(eq(enterpriseAssignments.id, submission.assignmentId));

      if (!assignment) {
        return reply.status(404).send({ error: 'Not Found', message: 'Assignment not found.' });
      }

      const [updated] = await db
        .update(enterpriseAssignmentSubmissions)
        .set({
          status: body.status,
          score: body.score ?? submission.score,
          reviewedAt: new Date(),
          reviewerMemberId: membership.id,
          updatedAt: new Date(),
        })
        .where(eq(enterpriseAssignmentSubmissions.id, submissionId))
        .returning();

      await logAuditEvent({
        householdId,
        schoolId: assignment.schoolId,
        actorMemberId: membership.id,
        eventType: 'submission_reviewed',
        targetType: 'submission',
        targetId: submissionId,
        metadata: {
          status: body.status,
          score: body.score ?? null,
          feedback: body.feedback ?? null,
        },
      });

      return updated;
    }
  );

  fastify.get(
    '/enterprise/classrooms/:classroomId/dashboard',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, classroomId } = request.params as {
        householdId: string;
        classroomId: string;
      };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      const classroom = await getClassroomById(classroomId, householdId);
      if (!classroom) {
        return reply.status(404).send({ error: 'Not Found', message: 'Classroom not found.' });
      }

      const dashboard = await buildClassroomDashboard(classroom);
      return dashboard;
    }
  );

  fastify.post(
    '/enterprise/schools/:schoolId/challenges',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };
      const body = createChallengeSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      if (!requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can create challenges.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const startsAt = new Date(body.startsAt);
      const endsAt = new Date(body.endsAt);
      if (endsAt <= startsAt) {
        return reply
          .status(400)
          .send({ error: 'Bad Request', message: 'Challenge end date must be after start date.' });
      }

      const [challenge] = await db
        .insert(enterpriseChallenges)
        .values({
          householdId,
          schoolId,
          title: body.title,
          description: body.description ?? null,
          challengeType: body.challengeType,
          startsAt,
          endsAt,
          rewardPoints: body.rewardPoints ?? 250,
          status: body.status ?? 'scheduled',
          createdByMemberId: membership.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await logAuditEvent({
        householdId,
        schoolId,
        actorMemberId: membership.id,
        eventType: 'challenge_created',
        targetType: 'challenge',
        targetId: challenge.id,
        metadata: { title: challenge.title, challengeType: challenge.challengeType },
      });

      return reply.status(201).send(challenge);
    }
  );

  fastify.get(
    '/enterprise/schools/:schoolId/challenges',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const challenges = await db
        .select()
        .from(enterpriseChallenges)
        .where(
          and(
            eq(enterpriseChallenges.householdId, householdId),
            eq(enterpriseChallenges.schoolId, schoolId)
          )
        )
        .orderBy(desc(enterpriseChallenges.startsAt));

      return { challenges };
    }
  );

  fastify.post(
    '/enterprise/challenges/:challengeId/participations',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, challengeId } = request.params as {
        householdId: string;
        challengeId: string;
      };
      const body = addChallengeParticipationSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership) {
        return reply.status(403).send({ error: 'Forbidden', message: 'Not a household member.' });
      }

      if (!requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({
            error: 'Forbidden',
            message: 'Only parents can update challenge participation.',
          });
      }

      const [challenge] = await db
        .select()
        .from(enterpriseChallenges)
        .where(
          and(
            eq(enterpriseChallenges.id, challengeId),
            eq(enterpriseChallenges.householdId, householdId)
          )
        );

      if (!challenge) {
        return reply.status(404).send({ error: 'Not Found', message: 'Challenge not found.' });
      }

      if (!body.classroomId && !body.studentMemberId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Participation requires classroomId or studentMemberId.',
        });
      }

      if (body.classroomId) {
        const classroom = await getClassroomById(body.classroomId, householdId);
        if (!classroom || classroom.schoolId !== challenge.schoolId) {
          return reply
            .status(404)
            .send({ error: 'Not Found', message: 'Classroom not found for this school.' });
        }
      }

      if (body.studentMemberId) {
        const student = await getMemberById(body.studentMemberId, householdId);
        if (!student) {
          return reply
            .status(404)
            .send({ error: 'Not Found', message: 'Student member not found.' });
        }
      }

      const [participation] = await db
        .insert(enterpriseChallengeParticipations)
        .values({
          householdId,
          challengeId,
          classroomId: body.classroomId ?? null,
          studentMemberId: body.studentMemberId ?? null,
          progress: body.progress ?? 0,
          rank: body.rank ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await logAuditEvent({
        householdId,
        schoolId: challenge.schoolId,
        actorMemberId: membership.id,
        eventType: 'challenge_participation_added',
        targetType: 'challenge_participation',
        targetId: participation.id,
        metadata: {
          classroomId: body.classroomId ?? null,
          studentMemberId: body.studentMemberId ?? null,
          progress: body.progress ?? 0,
        },
      });

      return reply.status(201).send(participation);
    }
  );

  fastify.post(
    '/enterprise/schools/:schoolId/lms/:provider',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId, provider } = request.params as {
        householdId: string;
        schoolId: string;
        provider: EnterpriseLmsProvider;
      };

      const body = configureLmsSchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership || !requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can configure LMS integrations.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      if (!lmsProviderValues.includes(provider)) {
        return reply
          .status(400)
          .send({ error: 'Bad Request', message: 'Unsupported LMS provider.' });
      }

      const [existing] = await db
        .select()
        .from(enterpriseLmsIntegrations)
        .where(
          and(
            eq(enterpriseLmsIntegrations.householdId, householdId),
            eq(enterpriseLmsIntegrations.schoolId, schoolId),
            eq(enterpriseLmsIntegrations.provider, provider)
          )
        );

      const now = new Date();

      let integration: typeof enterpriseLmsIntegrations.$inferSelect;
      if (existing) {
        const [updated] = await db
          .update(enterpriseLmsIntegrations)
          .set({
            syncEnabled: body.syncEnabled,
            externalTenantId: body.externalTenantId ?? null,
            clientId: body.clientId ?? null,
            configuration: body.configuration ?? null,
            updatedAt: now,
          })
          .where(eq(enterpriseLmsIntegrations.id, existing.id))
          .returning();
        integration = updated;
      } else {
        const [created] = await db
          .insert(enterpriseLmsIntegrations)
          .values({
            householdId,
            schoolId,
            provider,
            syncEnabled: body.syncEnabled,
            externalTenantId: body.externalTenantId ?? null,
            clientId: body.clientId ?? null,
            configuration: body.configuration ?? null,
            lastSyncedAt: null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        integration = created;
      }

      await logAuditEvent({
        householdId,
        schoolId,
        actorMemberId: membership.id,
        eventType: 'lms_integration_configured',
        targetType: 'lms_integration',
        targetId: integration.id,
        metadata: { provider, syncEnabled: integration.syncEnabled },
      });

      return integration;
    }
  );

  fastify.get(
    '/enterprise/schools/:schoolId/lms',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership || !requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can view LMS integrations.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const integrations = await db
        .select()
        .from(enterpriseLmsIntegrations)
        .where(
          and(
            eq(enterpriseLmsIntegrations.householdId, householdId),
            eq(enterpriseLmsIntegrations.schoolId, schoolId)
          )
        )
        .orderBy(enterpriseLmsIntegrations.provider);

      return { integrations };
    }
  );

  fastify.post(
    '/enterprise/schools/:schoolId/lms/:provider/sync',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId, provider } = request.params as {
        householdId: string;
        schoolId: string;
        provider: EnterpriseLmsProvider;
      };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership || !requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can run LMS sync.' });
      }

      const [integration] = await db
        .select()
        .from(enterpriseLmsIntegrations)
        .where(
          and(
            eq(enterpriseLmsIntegrations.householdId, householdId),
            eq(enterpriseLmsIntegrations.schoolId, schoolId),
            eq(enterpriseLmsIntegrations.provider, provider)
          )
        );

      if (!integration) {
        return reply
          .status(404)
          .send({ error: 'Not Found', message: 'LMS integration not configured.' });
      }

      const classrooms = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enterpriseClassrooms)
        .where(
          and(
            eq(enterpriseClassrooms.householdId, householdId),
            eq(enterpriseClassrooms.schoolId, schoolId)
          )
        );

      const assignments = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enterpriseAssignments)
        .where(
          and(
            eq(enterpriseAssignments.householdId, householdId),
            eq(enterpriseAssignments.schoolId, schoolId)
          )
        );

      const now = new Date();
      await db
        .update(enterpriseLmsIntegrations)
        .set({ lastSyncedAt: now, updatedAt: now })
        .where(eq(enterpriseLmsIntegrations.id, integration.id));

      const result = {
        provider,
        syncedAt: now,
        summary: {
          schoolsChecked: 1,
          classroomsLinked: classrooms[0]?.count ?? 0,
          assignmentsMirrored: assignments[0]?.count ?? 0,
        },
      };

      await logAuditEvent({
        householdId,
        schoolId,
        actorMemberId: membership.id,
        eventType: 'lms_sync_executed',
        targetType: 'lms_integration',
        targetId: integration.id,
        metadata: result,
      });

      return result;
    }
  );

  fastify.post(
    '/enterprise/schools/:schoolId/parent-visibility/:studentMemberId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId, studentMemberId } = request.params as {
        householdId: string;
        schoolId: string;
        studentMemberId: string;
      };
      const body = setVisibilitySchema.parse(request.body);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership || !requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can update visibility settings.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const student = await getMemberById(studentMemberId, householdId);
      if (!student) {
        return reply.status(404).send({ error: 'Not Found', message: 'Student member not found.' });
      }

      const [existing] = await db
        .select()
        .from(enterpriseParentVisibility)
        .where(
          and(
            eq(enterpriseParentVisibility.householdId, householdId),
            eq(enterpriseParentVisibility.schoolId, schoolId),
            eq(enterpriseParentVisibility.studentMemberId, studentMemberId)
          )
        );

      const now = new Date();

      let visibility: typeof enterpriseParentVisibility.$inferSelect;
      if (existing) {
        const [updated] = await db
          .update(enterpriseParentVisibility)
          .set({
            visibilityMode: body.visibilityMode,
            allowTeacherMessages: body.allowTeacherMessages ?? existing.allowTeacherMessages,
            allowChallengeVisibility:
              body.allowChallengeVisibility ?? existing.allowChallengeVisibility,
            updatedByMemberId: membership.id,
            updatedAt: now,
          })
          .where(eq(enterpriseParentVisibility.id, existing.id))
          .returning();
        visibility = updated;
      } else {
        const [created] = await db
          .insert(enterpriseParentVisibility)
          .values({
            householdId,
            schoolId,
            studentMemberId,
            visibilityMode: body.visibilityMode,
            allowTeacherMessages: body.allowTeacherMessages ?? true,
            allowChallengeVisibility: body.allowChallengeVisibility ?? true,
            updatedByMemberId: membership.id,
            updatedAt: now,
          })
          .returning();
        visibility = created;
      }

      await logAuditEvent({
        householdId,
        schoolId,
        actorMemberId: membership.id,
        eventType: 'parent_visibility_updated',
        targetType: 'parent_visibility',
        targetId: visibility.id,
        metadata: {
          studentMemberId,
          visibilityMode: visibility.visibilityMode,
          allowTeacherMessages: visibility.allowTeacherMessages,
          allowChallengeVisibility: visibility.allowChallengeVisibility,
        },
      });

      return visibility;
    }
  );

  fastify.get(
    '/enterprise/schools/:schoolId/parent-visibility',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership || !requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can view visibility settings.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const visibility = await db
        .select()
        .from(enterpriseParentVisibility)
        .where(
          and(
            eq(enterpriseParentVisibility.householdId, householdId),
            eq(enterpriseParentVisibility.schoolId, schoolId)
          )
        )
        .orderBy(desc(enterpriseParentVisibility.updatedAt));

      return { visibility };
    }
  );

  fastify.get(
    '/enterprise/schools/:schoolId/analytics',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership || !requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can view school analytics.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      return buildSchoolAnalytics(householdId, schoolId);
    }
  );

  fastify.get(
    '/enterprise/schools/:schoolId/reports',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { user } = request as AuthenticatedRequest;
      const { householdId, schoolId } = request.params as { householdId: string; schoolId: string };
      const { format } = reportQuerySchema.parse(request.query);

      const membership = await getMembershipByUser(user.id, householdId);
      if (!membership || !requireParentAccess(membership)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden', message: 'Only parents can generate reports.' });
      }

      const school = await getSchoolById(schoolId, householdId);
      if (!school) {
        return reply.status(404).send({ error: 'Not Found', message: 'School not found.' });
      }

      const analytics = await buildSchoolAnalytics(householdId, schoolId);
      const classrooms = await db
        .select()
        .from(enterpriseClassrooms)
        .where(
          and(
            eq(enterpriseClassrooms.householdId, householdId),
            eq(enterpriseClassrooms.schoolId, schoolId)
          )
        );

      const challenges = await db
        .select()
        .from(enterpriseChallenges)
        .where(
          and(
            eq(enterpriseChallenges.householdId, householdId),
            eq(enterpriseChallenges.schoolId, schoolId)
          )
        )
        .orderBy(desc(enterpriseChallenges.createdAt));

      const reportLines = [
        `School Report: ${school.name}`,
        `Generated: ${new Date().toISOString()}`,
        `School Type: ${school.schoolType}`,
        `FERPA Mode: ${school.ferpaModeEnabled ? 'enabled' : 'disabled'}`,
        `COPPA Mode: ${school.coppaModeEnabled ? 'enabled' : 'disabled'}`,
        `Classrooms: ${analytics.classroomCount}`,
        `Students: ${analytics.studentCount}`,
        `Assignments: ${analytics.assignmentCount}`,
        `Submissions: ${analytics.submissionCount}`,
        `Approval Rate: ${analytics.approvalRate}%`,
        `Challenges: ${analytics.challengeCount}`,
        `Active Challenges: ${analytics.activeChallengeCount}`,
        `LMS Providers: ${analytics.lmsConnectedProviders.join(', ') || 'None'}`,
        'Classroom Breakdown:',
        ...classrooms.map((classroom) => `${classroom.name} (${classroom.gradeLevel})`),
        'Challenge Timeline:',
        ...challenges.map(
          (challenge) =>
            `${challenge.title} [${challenge.status}] ${challenge.startsAt.toISOString()} - ${challenge.endsAt.toISOString()}`
        ),
      ];

      const fileNameBase = `school-${school.id}-report-${new Date().toISOString().slice(0, 10)}`;

      if (format === 'excel') {
        const csvRows = [
          ['metric', 'value'].join(','),
          ['school_name', csvEscape(school.name)].join(','),
          ['school_type', csvEscape(school.schoolType)].join(','),
          ['ferpa_mode', csvEscape(school.ferpaModeEnabled ? 'enabled' : 'disabled')].join(','),
          ['coppa_mode', csvEscape(school.coppaModeEnabled ? 'enabled' : 'disabled')].join(','),
          ['classrooms', String(analytics.classroomCount)].join(','),
          ['students', String(analytics.studentCount)].join(','),
          ['assignments', String(analytics.assignmentCount)].join(','),
          ['submissions', String(analytics.submissionCount)].join(','),
          ['approval_rate', String(analytics.approvalRate)].join(','),
          ['challenges', String(analytics.challengeCount)].join(','),
          ['active_challenges', String(analytics.activeChallengeCount)].join(','),
        ];

        const csvContent = csvRows.join('\n');

        await logAuditEvent({
          householdId,
          schoolId,
          actorMemberId: membership.id,
          eventType: 'school_report_generated',
          targetType: 'school_report',
          targetId: `${schoolId}:excel`,
          metadata: { format: 'excel' },
        });

        return {
          format: 'excel',
          fileName: `${fileNameBase}.csv`,
          mimeType: 'text/csv',
          contentBase64: Buffer.from(csvContent, 'utf8').toString('base64'),
          generatedAt: new Date(),
        };
      }

      const pdfBuffer = buildPdfBuffer(reportLines);

      await logAuditEvent({
        householdId,
        schoolId,
        actorMemberId: membership.id,
        eventType: 'school_report_generated',
        targetType: 'school_report',
        targetId: `${schoolId}:pdf`,
        metadata: { format: 'pdf' },
      });

      return {
        format: 'pdf',
        fileName: `${fileNameBase}.pdf`,
        mimeType: 'application/pdf',
        contentBase64: pdfBuffer.toString('base64'),
        generatedAt: new Date(),
      };
    }
  );

  fastify.get('/enterprise/imports', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembershipByUser(user.id, householdId);
    if (!membership || !requireParentAccess(membership)) {
      return reply
        .status(403)
        .send({ error: 'Forbidden', message: 'Only parents can view import history.' });
    }

    const imports = await db
      .select()
      .from(enterpriseBulkImports)
      .where(eq(enterpriseBulkImports.householdId, householdId))
      .orderBy(desc(enterpriseBulkImports.importedAt))
      .limit(50);

    return { imports };
  });

  fastify.get('/enterprise/audits', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await getMembershipByUser(user.id, householdId);
    if (!membership || !requireParentAccess(membership)) {
      return reply
        .status(403)
        .send({ error: 'Forbidden', message: 'Only parents can view audit logs.' });
    }

    const audits = await db
      .select()
      .from(enterpriseAdminAudits)
      .where(eq(enterpriseAdminAudits.householdId, householdId))
      .orderBy(desc(enterpriseAdminAudits.createdAt))
      .limit(200);

    return { audits };
  });
}
