export type EnterpriseSchoolType =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'k12'
  | 'district_program'
  | 'other';
export type EnterpriseLmsProvider = 'canvas' | 'google_classroom' | 'clever';
export type EnterpriseVisibilityMode = 'private' | 'summary' | 'full';
export type EnterpriseAssignmentType = 'chore' | 'task' | 'homework';
export type EnterpriseAssignmentStatus = 'active' | 'archived';
export type EnterpriseSubmissionStatus = 'assigned' | 'submitted' | 'approved' | 'rejected';
export type EnterpriseChallengeType = 'classroom' | 'school' | 'district';
export type EnterpriseChallengeStatus = 'scheduled' | 'active' | 'completed' | 'canceled';

export interface EnterpriseDistrict {
  id: string;
  householdId: string;
  name: string;
  code: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseSchool {
  id: string;
  householdId: string;
  districtId: string | null;
  name: string;
  schoolType: EnterpriseSchoolType;
  timezone: string;
  brandingName: string | null;
  brandingLogoUrl: string | null;
  brandingPrimaryColor: string | null;
  ferpaModeEnabled: boolean;
  coppaModeEnabled: boolean;
  parentVisibilityDefault: EnterpriseVisibilityMode;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseClassroom {
  id: string;
  householdId: string;
  schoolId: string;
  name: string;
  gradeLevel: string;
  section: string | null;
  subject: string | null;
  teacherMemberId: string | null;
  externalClassId: string | null;
  lmsProvider: EnterpriseLmsProvider | null;
  lmsCourseId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseClassroomStudent {
  id: string;
  householdId: string;
  schoolId: string;
  classroomId: string;
  memberId: string;
  studentNumber: string | null;
  visibilityModeOverride: EnterpriseVisibilityMode | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseAssignment {
  id: string;
  householdId: string;
  schoolId: string;
  classroomId: string;
  title: string;
  description: string | null;
  assignmentType: EnterpriseAssignmentType;
  dueAt: Date | null;
  points: number;
  requiresProof: boolean;
  createdByMemberId: string;
  status: EnterpriseAssignmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseAssignmentSubmission {
  id: string;
  householdId: string;
  assignmentId: string;
  studentMemberId: string;
  status: EnterpriseSubmissionStatus;
  evidenceNote: string | null;
  score: number | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewerMemberId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseChallenge {
  id: string;
  householdId: string;
  schoolId: string;
  title: string;
  description: string | null;
  challengeType: EnterpriseChallengeType;
  startsAt: Date;
  endsAt: Date;
  rewardPoints: number;
  status: EnterpriseChallengeStatus;
  createdByMemberId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseChallengeParticipation {
  id: string;
  householdId: string;
  challengeId: string;
  classroomId: string | null;
  studentMemberId: string | null;
  progress: number;
  rank: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseBulkImport {
  id: string;
  householdId: string;
  schoolId: string;
  classroomId: string | null;
  importType: 'students' | 'classrooms';
  sourceFileName: string | null;
  rowCount: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
  importedByMemberId: string;
  importedAt: Date;
}

export interface EnterpriseLmsIntegration {
  id: string;
  householdId: string;
  schoolId: string;
  provider: EnterpriseLmsProvider;
  syncEnabled: boolean;
  externalTenantId: string | null;
  clientId: string | null;
  lastSyncedAt: Date | null;
  configuration: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseParentVisibility {
  id: string;
  householdId: string;
  schoolId: string;
  studentMemberId: string;
  visibilityMode: EnterpriseVisibilityMode;
  allowTeacherMessages: boolean;
  allowChallengeVisibility: boolean;
  updatedByMemberId: string;
  updatedAt: Date;
}

export interface EnterpriseAdminAuditEvent {
  id: string;
  householdId: string;
  schoolId: string | null;
  actorMemberId: string | null;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateEnterpriseDistrictRequest {
  name: string;
  code?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateEnterpriseSchoolRequest {
  districtId?: string;
  name: string;
  schoolType: EnterpriseSchoolType;
  timezone?: string;
  brandingName?: string;
  brandingLogoUrl?: string;
  brandingPrimaryColor?: string;
  ferpaModeEnabled?: boolean;
  coppaModeEnabled?: boolean;
  parentVisibilityDefault?: EnterpriseVisibilityMode;
}

export interface UpdateEnterpriseSchoolRequest {
  name?: string;
  schoolType?: EnterpriseSchoolType;
  timezone?: string;
  brandingName?: string | null;
  brandingLogoUrl?: string | null;
  brandingPrimaryColor?: string | null;
  ferpaModeEnabled?: boolean;
  coppaModeEnabled?: boolean;
  parentVisibilityDefault?: EnterpriseVisibilityMode;
  isActive?: boolean;
}

export interface CreateEnterpriseClassroomRequest {
  name: string;
  gradeLevel: string;
  section?: string;
  subject?: string;
  teacherMemberId?: string;
  externalClassId?: string;
  lmsProvider?: EnterpriseLmsProvider;
  lmsCourseId?: string;
}

export interface CreateEnterpriseAssignmentRequest {
  title: string;
  description?: string;
  assignmentType: EnterpriseAssignmentType;
  dueAt?: string;
  points?: number;
  requiresProof?: boolean;
}

export interface SubmitEnterpriseAssignmentRequest {
  studentMemberId?: string;
  evidenceNote?: string;
}

export interface ReviewEnterpriseSubmissionRequest {
  status: 'approved' | 'rejected';
  score?: number;
  feedback?: string;
}

export interface CreateEnterpriseChallengeRequest {
  title: string;
  description?: string;
  challengeType: EnterpriseChallengeType;
  startsAt: string;
  endsAt: string;
  rewardPoints?: number;
}

export interface ConfigureEnterpriseLmsRequest {
  syncEnabled: boolean;
  externalTenantId?: string;
  clientId?: string;
  configuration?: Record<string, unknown>;
}

export interface SetEnterpriseParentVisibilityRequest {
  visibilityMode: EnterpriseVisibilityMode;
  allowTeacherMessages?: boolean;
  allowChallengeVisibility?: boolean;
}

export interface BulkImportEnterpriseStudentsRequest {
  sourceFileName?: string;
  csv: string;
}

export interface AddEnterpriseStudentRequest {
  memberId?: string;
  name?: string;
  role?: 'child' | 'teen';
  studentNumber?: string;
  visibilityModeOverride?: EnterpriseVisibilityMode;
}

export interface EnterpriseClassroomDashboard {
  classroom: EnterpriseClassroom;
  studentCount: number;
  activeAssignments: number;
  submittedAssignments: number;
  approvedAssignments: number;
  completionRate: number;
  topStudents: Array<{
    memberId: string;
    memberName: string;
    submissionsApproved: number;
    submissionsTotal: number;
    averageScore: number | null;
  }>;
}

export interface EnterpriseSchoolAdminAnalytics {
  schoolId: string;
  classroomCount: number;
  studentCount: number;
  assignmentCount: number;
  submissionCount: number;
  approvalRate: number;
  challengeCount: number;
  activeChallengeCount: number;
  lmsConnectedProviders: EnterpriseLmsProvider[];
}

export interface EnterpriseDistrictOverview {
  district: EnterpriseDistrict;
  schoolCount: number;
  classroomCount: number;
  studentCount: number;
  assignmentCount: number;
  approvalRate: number;
}

export interface EnterpriseStudentWithProfile extends EnterpriseClassroomStudent {
  memberName: string;
  memberRole: 'parent' | 'child' | 'teen' | 'viewer' | 'caregiver';
}

export interface EnterpriseAssignmentWithSubmissions extends EnterpriseAssignment {
  submissions: EnterpriseAssignmentSubmission[];
}

export interface EnterpriseBulkImportResult {
  importLog: EnterpriseBulkImport;
  createdStudentMembers: number;
  attachedStudents: number;
  skippedRows: number;
}

export interface EnterpriseLmsSyncResult {
  provider: EnterpriseLmsProvider;
  syncedAt: Date;
  summary: {
    schoolsChecked: number;
    classroomsLinked: number;
    assignmentsMirrored: number;
  };
}

export interface EnterpriseReportFile {
  format: 'pdf' | 'excel';
  fileName: string;
  mimeType: string;
  contentBase64: string;
  generatedAt: Date;
}

export interface EnterpriseOverviewResponse {
  districts: EnterpriseDistrictOverview[];
  schools: EnterpriseSchool[];
  schoolAnalytics: EnterpriseSchoolAdminAnalytics[];
  recentImports: EnterpriseBulkImport[];
  lmsIntegrations: EnterpriseLmsIntegration[];
  latestAudits: EnterpriseAdminAuditEvent[];
}
