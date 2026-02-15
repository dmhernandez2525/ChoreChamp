import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useAddEnterpriseChallengeParticipation,
  useAddEnterpriseStudent,
  useConfigureEnterpriseLms,
  useCreateEnterpriseAssignment,
  useCreateEnterpriseChallenge,
  useCreateEnterpriseClassroom,
  useCreateEnterpriseDistrict,
  useCreateEnterpriseSchool,
  useEnterpriseAssignments,
  useEnterpriseAudits,
  useEnterpriseClassroomDashboard,
  useEnterpriseClassrooms,
  useEnterpriseChallenges,
  useEnterpriseImports,
  useEnterpriseLms,
  useEnterpriseOverview,
  useEnterpriseParentVisibility,
  useEnterpriseSchoolAnalytics,
  useEnterpriseStudents,
  useExportEnterpriseStudents,
  useGenerateEnterpriseReport,
  useImportEnterpriseStudents,
  useMembers,
  useReviewEnterpriseSubmission,
  useSetEnterpriseParentVisibility,
  useSyncEnterpriseLms,
} from '@chorechamp/api-client';
import type {
  EnterpriseChallengeType,
  EnterpriseLmsProvider,
  EnterpriseSchoolType,
  EnterpriseVisibilityMode,
} from '@chorechamp/types';
import { Button } from '@chorechamp/ui';
import { useAuth } from '../context/AuthContext';

const schoolTypeOptions: EnterpriseSchoolType[] = [
  'elementary',
  'middle',
  'high',
  'k12',
  'district_program',
  'other',
];
const challengeTypeOptions: EnterpriseChallengeType[] = ['classroom', 'school', 'district'];
const lmsProviderOptions: EnterpriseLmsProvider[] = ['canvas', 'google_classroom', 'clever'];
const visibilityOptions: EnterpriseVisibilityMode[] = ['private', 'summary', 'full'];

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return 'N/A';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function decodeBase64ToBlob(base64: string, mimeType: string): Blob {
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

function downloadBase64File(fileName: string, mimeType: string, contentBase64: string) {
  const blob = decodeBase64ToBlob(contentBase64, mimeType);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function EnterpriseSchoolEdition() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [districtForm, setDistrictForm] = useState({
    name: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
  });

  const [schoolForm, setSchoolForm] = useState({
    districtId: '',
    name: '',
    schoolType: 'k12' as EnterpriseSchoolType,
    timezone: 'America/New_York',
    brandingName: '',
    brandingLogoUrl: '',
    brandingPrimaryColor: '#2563EB',
    ferpaModeEnabled: true,
    coppaModeEnabled: true,
    parentVisibilityDefault: 'summary' as EnterpriseVisibilityMode,
  });

  const [classroomForm, setClassroomForm] = useState({
    name: '',
    gradeLevel: '',
    section: '',
    subject: '',
    teacherMemberId: '',
  });

  const [studentForm, setStudentForm] = useState({
    memberId: '',
    name: '',
    role: 'child' as 'child' | 'teen',
    studentNumber: '',
    visibilityModeOverride: 'summary' as EnterpriseVisibilityMode,
  });

  const [bulkCsv, setBulkCsv] = useState('name,role,studentNumber,visibilityMode\n');

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    assignmentType: 'task' as 'chore' | 'task' | 'homework',
    dueAt: '',
    points: 25,
    requiresProof: false,
  });

  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    challengeType: 'school' as EnterpriseChallengeType,
    startsAt: '',
    endsAt: '',
    rewardPoints: 250,
  });

  const [lmsForm, setLmsForm] = useState({
    provider: 'canvas' as EnterpriseLmsProvider,
    syncEnabled: true,
    externalTenantId: '',
    clientId: '',
  });

  const [visibilityForm, setVisibilityForm] = useState({
    studentMemberId: '',
    visibilityMode: 'summary' as EnterpriseVisibilityMode,
    allowTeacherMessages: true,
    allowChallengeVisibility: true,
  });

  const { data: membersData } = useMembers(householdId ?? '');
  const members = membersData ?? [];

  const currentMember = useMemo(
    () => members.find((member) => member.userId === user?.id) ?? null,
    [members, user]
  );
  const isParent = currentMember?.role === 'parent';

  const overviewQuery = useEnterpriseOverview(householdId ?? '', {
    enabled: Boolean(householdId && isParent),
  });

  const schools = overviewQuery.data?.schools ?? [];
  const districtOverviews = overviewQuery.data?.districts ?? [];

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');

  useEffect(() => {
    if (!selectedSchoolId && schools.length > 0) {
      setSelectedSchoolId(schools[0].id);
    }
  }, [selectedSchoolId, schools]);

  const classroomsQuery = useEnterpriseClassrooms(householdId ?? '', selectedSchoolId, {
    enabled: Boolean(householdId && selectedSchoolId && isParent),
  });

  const classrooms = classroomsQuery.data?.classrooms ?? [];

  useEffect(() => {
    if (!selectedClassroomId && classrooms.length > 0) {
      setSelectedClassroomId(classrooms[0].id);
    }
  }, [selectedClassroomId, classrooms]);

  const studentsQuery = useEnterpriseStudents(householdId ?? '', selectedClassroomId, {
    enabled: Boolean(householdId && selectedClassroomId && isParent),
  });
  const assignmentsQuery = useEnterpriseAssignments(householdId ?? '', selectedClassroomId, {
    enabled: Boolean(householdId && selectedClassroomId && isParent),
  });
  const classroomDashboardQuery = useEnterpriseClassroomDashboard(
    householdId ?? '',
    selectedClassroomId,
    {
      enabled: Boolean(householdId && selectedClassroomId && isParent),
    }
  );

  const challengesQuery = useEnterpriseChallenges(householdId ?? '', selectedSchoolId, {
    enabled: Boolean(householdId && selectedSchoolId && isParent),
  });

  const lmsQuery = useEnterpriseLms(householdId ?? '', selectedSchoolId, {
    enabled: Boolean(householdId && selectedSchoolId && isParent),
  });

  const visibilityQuery = useEnterpriseParentVisibility(householdId ?? '', selectedSchoolId, {
    enabled: Boolean(householdId && selectedSchoolId && isParent),
  });

  const schoolAnalyticsQuery = useEnterpriseSchoolAnalytics(householdId ?? '', selectedSchoolId, {
    enabled: Boolean(householdId && selectedSchoolId && isParent),
  });

  const importsQuery = useEnterpriseImports(householdId ?? '', {
    enabled: Boolean(householdId && isParent),
  });

  const auditsQuery = useEnterpriseAudits(householdId ?? '', {
    enabled: Boolean(householdId && isParent),
  });

  const createDistrict = useCreateEnterpriseDistrict(householdId ?? '');
  const createSchool = useCreateEnterpriseSchool(householdId ?? '');
  const createClassroom = useCreateEnterpriseClassroom(householdId ?? '');
  const addStudent = useAddEnterpriseStudent(householdId ?? '');
  const importStudents = useImportEnterpriseStudents(householdId ?? '');
  const createAssignment = useCreateEnterpriseAssignment(householdId ?? '');
  const reviewSubmission = useReviewEnterpriseSubmission(householdId ?? '');
  const createChallenge = useCreateEnterpriseChallenge(householdId ?? '');
  const addChallengeParticipation = useAddEnterpriseChallengeParticipation(householdId ?? '');
  const configureLms = useConfigureEnterpriseLms(householdId ?? '');
  const syncLms = useSyncEnterpriseLms(householdId ?? '');
  const setParentVisibility = useSetEnterpriseParentVisibility(householdId ?? '');
  const exportStudents = useExportEnterpriseStudents(householdId ?? '');
  const generateReport = useGenerateEnterpriseReport(householdId ?? '');

  const loading = overviewQuery.isLoading;

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null);
      setMessage(null);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    }
  }

  const handleCreateDistrict = async () => {
    await runAction(async () => {
      await createDistrict.mutateAsync({
        name: districtForm.name,
        ...(districtForm.code ? { code: districtForm.code } : {}),
        ...(districtForm.contactEmail ? { contactEmail: districtForm.contactEmail } : {}),
        ...(districtForm.contactPhone ? { contactPhone: districtForm.contactPhone } : {}),
      });
      setDistrictForm({ name: '', code: '', contactEmail: '', contactPhone: '' });
      setMessage('District created.');
      await overviewQuery.refetch();
    });
  };

  const handleCreateSchool = async () => {
    await runAction(async () => {
      await createSchool.mutateAsync({
        ...(schoolForm.districtId ? { districtId: schoolForm.districtId } : {}),
        name: schoolForm.name,
        schoolType: schoolForm.schoolType,
        timezone: schoolForm.timezone,
        ...(schoolForm.brandingName ? { brandingName: schoolForm.brandingName } : {}),
        ...(schoolForm.brandingLogoUrl ? { brandingLogoUrl: schoolForm.brandingLogoUrl } : {}),
        ...(schoolForm.brandingPrimaryColor
          ? { brandingPrimaryColor: schoolForm.brandingPrimaryColor }
          : {}),
        ferpaModeEnabled: schoolForm.ferpaModeEnabled,
        coppaModeEnabled: schoolForm.coppaModeEnabled,
        parentVisibilityDefault: schoolForm.parentVisibilityDefault,
      });
      setSchoolForm((previous) => ({
        ...previous,
        name: '',
        brandingName: '',
        brandingLogoUrl: '',
      }));
      setMessage('School created.');
      await overviewQuery.refetch();
    });
  };

  const handleCreateClassroom = async () => {
    if (!selectedSchoolId) return;

    await runAction(async () => {
      await createClassroom.mutateAsync({
        schoolId: selectedSchoolId,
        data: {
          name: classroomForm.name,
          gradeLevel: classroomForm.gradeLevel,
          ...(classroomForm.section ? { section: classroomForm.section } : {}),
          ...(classroomForm.subject ? { subject: classroomForm.subject } : {}),
          ...(classroomForm.teacherMemberId
            ? { teacherMemberId: classroomForm.teacherMemberId }
            : {}),
        },
      });
      setClassroomForm({ name: '', gradeLevel: '', section: '', subject: '', teacherMemberId: '' });
      setMessage('Classroom created.');
      await classroomsQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleAddStudent = async () => {
    if (!selectedClassroomId) return;

    await runAction(async () => {
      await addStudent.mutateAsync({
        classroomId: selectedClassroomId,
        data: {
          ...(studentForm.memberId ? { memberId: studentForm.memberId } : {}),
          ...(studentForm.name ? { name: studentForm.name } : {}),
          role: studentForm.role,
          ...(studentForm.studentNumber ? { studentNumber: studentForm.studentNumber } : {}),
          visibilityModeOverride: studentForm.visibilityModeOverride,
        },
      });
      setStudentForm((previous) => ({ ...previous, memberId: '', name: '', studentNumber: '' }));
      setMessage('Student enrolled in classroom.');
      await studentsQuery.refetch();
      await classroomDashboardQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleImportStudents = async () => {
    if (!selectedClassroomId) return;

    await runAction(async () => {
      const response = await importStudents.mutateAsync({
        classroomId: selectedClassroomId,
        data: {
          sourceFileName: 'bulk-students.csv',
          csv: bulkCsv,
        },
      });
      setMessage(
        `Imported ${response.attachedStudents} students (${response.skippedRows} rows skipped).`
      );
      await studentsQuery.refetch();
      await importsQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleExportStudents = async () => {
    if (!selectedClassroomId) return;

    await runAction(async () => {
      const exported = await exportStudents.mutateAsync(selectedClassroomId);
      downloadBase64File(exported.fileName, exported.mimeType, exported.contentBase64);
      setMessage('Classroom roster export downloaded.');
    });
  };

  const handleCreateAssignment = async () => {
    if (!selectedClassroomId) return;

    await runAction(async () => {
      await createAssignment.mutateAsync({
        classroomId: selectedClassroomId,
        data: {
          title: assignmentForm.title,
          ...(assignmentForm.description ? { description: assignmentForm.description } : {}),
          assignmentType: assignmentForm.assignmentType,
          ...(assignmentForm.dueAt ? { dueAt: new Date(assignmentForm.dueAt).toISOString() } : {}),
          points: assignmentForm.points,
          requiresProof: assignmentForm.requiresProof,
        },
      });
      setAssignmentForm({
        title: '',
        description: '',
        assignmentType: 'task',
        dueAt: '',
        points: 25,
        requiresProof: false,
      });
      setMessage('Assignment created.');
      await assignmentsQuery.refetch();
      await classroomDashboardQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleReviewSubmission = async (submissionId: string, status: 'approved' | 'rejected') => {
    await runAction(async () => {
      await reviewSubmission.mutateAsync({
        submissionId,
        data: {
          status,
          score: status === 'approved' ? 100 : 0,
          feedback: status === 'approved' ? 'Great work.' : 'Please revise and resubmit.',
        },
      });
      setMessage(status === 'approved' ? 'Submission approved.' : 'Submission rejected.');
      await assignmentsQuery.refetch();
      await classroomDashboardQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleCreateChallenge = async () => {
    if (!selectedSchoolId) return;

    await runAction(async () => {
      const challenge = await createChallenge.mutateAsync({
        schoolId: selectedSchoolId,
        data: {
          title: challengeForm.title,
          ...(challengeForm.description ? { description: challengeForm.description } : {}),
          challengeType: challengeForm.challengeType,
          startsAt: new Date(challengeForm.startsAt).toISOString(),
          endsAt: new Date(challengeForm.endsAt).toISOString(),
          rewardPoints: challengeForm.rewardPoints,
        },
      });

      if (selectedClassroomId) {
        await addChallengeParticipation.mutateAsync({
          challengeId: challenge.id,
          schoolId: selectedSchoolId,
          data: {
            classroomId: selectedClassroomId,
            progress: 0,
          },
        });
      }

      setChallengeForm({
        title: '',
        description: '',
        challengeType: 'school',
        startsAt: '',
        endsAt: '',
        rewardPoints: 250,
      });
      setMessage('Challenge created.');
      await challengesQuery.refetch();
      await schoolAnalyticsQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleConfigureLms = async () => {
    if (!selectedSchoolId) return;

    await runAction(async () => {
      await configureLms.mutateAsync({
        schoolId: selectedSchoolId,
        provider: lmsForm.provider,
        data: {
          syncEnabled: lmsForm.syncEnabled,
          ...(lmsForm.externalTenantId ? { externalTenantId: lmsForm.externalTenantId } : {}),
          ...(lmsForm.clientId ? { clientId: lmsForm.clientId } : {}),
          configuration: {
            configuredAt: new Date().toISOString(),
            configuredBy: currentMember?.id ?? null,
          },
        },
      });
      setMessage('LMS integration saved.');
      await lmsQuery.refetch();
      await schoolAnalyticsQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleSyncLms = async (provider: EnterpriseLmsProvider) => {
    if (!selectedSchoolId) return;

    await runAction(async () => {
      await syncLms.mutateAsync({
        schoolId: selectedSchoolId,
        provider,
      });
      setMessage(`${provider} sync completed.`);
      await lmsQuery.refetch();
      await schoolAnalyticsQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleSetVisibility = async () => {
    if (!selectedSchoolId || !visibilityForm.studentMemberId) return;

    await runAction(async () => {
      await setParentVisibility.mutateAsync({
        schoolId: selectedSchoolId,
        studentMemberId: visibilityForm.studentMemberId,
        data: {
          visibilityMode: visibilityForm.visibilityMode,
          allowTeacherMessages: visibilityForm.allowTeacherMessages,
          allowChallengeVisibility: visibilityForm.allowChallengeVisibility,
        },
      });
      setMessage('Parent visibility updated.');
      await visibilityQuery.refetch();
      await overviewQuery.refetch();
    });
  };

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    if (!selectedSchoolId) return;

    await runAction(async () => {
      const report = await generateReport.mutateAsync({ schoolId: selectedSchoolId, format });
      downloadBase64File(report.fileName, report.mimeType, report.contentBase64);
      setMessage(`${format.toUpperCase()} report downloaded.`);
    });
  };

  if (!householdId) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-red-600">Household ID is missing from the URL.</p>
      </div>
    );
  }

  if (!isParent) {
    return (
      <div className="mx-auto max-w-5xl p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Enterprise & School Edition</h1>
        <p className="text-gray-600">
          This area is available to household parents with school administration permissions.
        </p>
        <Link className="text-blue-600 hover:underline" to={`/households/${householdId}`}>
          Return to dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-gray-600">Loading enterprise data...</p>
      </div>
    );
  }

  const studentMembers = members.filter(
    (member) => member.role === 'child' || member.role === 'teen'
  );

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Enterprise & School Edition</h1>
        <p className="text-gray-600">
          Classroom operations, district controls, LMS integrations, and FERPA/COPPA visibility
          workflows.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link className="text-blue-600 hover:underline" to={`/households/${householdId}`}>
            Household Dashboard
          </Link>
          <Link className="text-blue-600 hover:underline" to={`/households/${householdId}/school`}>
            School & Extracurricular
          </Link>
        </div>
      </header>

      {message && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Districts</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{districtOverviews.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Schools</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{schools.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Recent Imports</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {importsQuery.data?.imports.length ?? 0}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">District Management</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="District name"
              value={districtForm.name}
              onChange={(event) =>
                setDistrictForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="District code"
              value={districtForm.code}
              onChange={(event) =>
                setDistrictForm((prev) => ({ ...prev, code: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Contact email"
              value={districtForm.contactEmail}
              onChange={(event) =>
                setDistrictForm((prev) => ({ ...prev, contactEmail: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Contact phone"
              value={districtForm.contactPhone}
              onChange={(event) =>
                setDistrictForm((prev) => ({ ...prev, contactPhone: event.target.value }))
              }
            />
          </div>
          <Button
            onClick={handleCreateDistrict}
            disabled={createDistrict.isPending || !districtForm.name.trim()}
          >
            Create District
          </Button>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="py-2 pr-4">District</th>
                  <th className="py-2 pr-4">Schools</th>
                  <th className="py-2 pr-4">Students</th>
                  <th className="py-2 pr-4">Approval Rate</th>
                </tr>
              </thead>
              <tbody>
                {districtOverviews.map((overview) => (
                  <tr key={overview.district.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-800">
                      {overview.district.name}
                    </td>
                    <td className="py-2 pr-4">{overview.schoolCount}</td>
                    <td className="py-2 pr-4">{overview.studentCount}</td>
                    <td className="py-2 pr-4">{overview.approvalRate}%</td>
                  </tr>
                ))}
                {districtOverviews.length === 0 && (
                  <tr>
                    <td className="py-3 text-gray-500" colSpan={4}>
                      No districts yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">School Setup & Compliance</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={schoolForm.districtId}
              onChange={(event) =>
                setSchoolForm((prev) => ({ ...prev, districtId: event.target.value }))
              }
            >
              <option value="">No district</option>
              {districtOverviews.map((overview) => (
                <option key={overview.district.id} value={overview.district.id}>
                  {overview.district.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="School name"
              value={schoolForm.name}
              onChange={(event) => setSchoolForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={schoolForm.schoolType}
              onChange={(event) =>
                setSchoolForm((prev) => ({
                  ...prev,
                  schoolType: event.target.value as EnterpriseSchoolType,
                }))
              }
            >
              {schoolTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Timezone"
              value={schoolForm.timezone}
              onChange={(event) =>
                setSchoolForm((prev) => ({ ...prev, timezone: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Branding name"
              value={schoolForm.brandingName}
              onChange={(event) =>
                setSchoolForm((prev) => ({ ...prev, brandingName: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Branding logo URL"
              value={schoolForm.brandingLogoUrl}
              onChange={(event) =>
                setSchoolForm((prev) => ({ ...prev, brandingLogoUrl: event.target.value }))
              }
            />
            <input
              type="color"
              className="h-10 rounded-md border border-gray-300 px-1 py-1"
              value={schoolForm.brandingPrimaryColor}
              onChange={(event) =>
                setSchoolForm((prev) => ({ ...prev, brandingPrimaryColor: event.target.value }))
              }
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={schoolForm.parentVisibilityDefault}
              onChange={(event) =>
                setSchoolForm((prev) => ({
                  ...prev,
                  parentVisibilityDefault: event.target.value as EnterpriseVisibilityMode,
                }))
              }
            >
              {visibilityOptions.map((option) => (
                <option key={option} value={option}>
                  Default visibility: {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={schoolForm.ferpaModeEnabled}
                onChange={(event) =>
                  setSchoolForm((prev) => ({ ...prev, ferpaModeEnabled: event.target.checked }))
                }
              />
              FERPA mode enabled
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={schoolForm.coppaModeEnabled}
                onChange={(event) =>
                  setSchoolForm((prev) => ({ ...prev, coppaModeEnabled: event.target.checked }))
                }
              />
              COPPA mode enabled
            </label>
          </div>

          <Button
            onClick={handleCreateSchool}
            disabled={createSchool.isPending || !schoolForm.name.trim()}
          >
            Create School
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="selectedSchool">
              Active school
            </label>
            <select
              id="selectedSchool"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={selectedSchoolId}
              onChange={(event) => {
                setSelectedSchoolId(event.target.value);
                setSelectedClassroomId('');
              }}
            >
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.schoolType})
                </option>
              ))}
              {schools.length === 0 && <option value="">No schools yet</option>}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Classrooms & Student Roster</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Classroom name"
              value={classroomForm.name}
              onChange={(event) =>
                setClassroomForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Grade level"
              value={classroomForm.gradeLevel}
              onChange={(event) =>
                setClassroomForm((prev) => ({ ...prev, gradeLevel: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Section"
              value={classroomForm.section}
              onChange={(event) =>
                setClassroomForm((prev) => ({ ...prev, section: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Subject"
              value={classroomForm.subject}
              onChange={(event) =>
                setClassroomForm((prev) => ({ ...prev, subject: event.target.value }))
              }
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
              value={classroomForm.teacherMemberId}
              onChange={(event) =>
                setClassroomForm((prev) => ({ ...prev, teacherMemberId: event.target.value }))
              }
            >
              <option value="">No teacher selected</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleCreateClassroom}
            disabled={
              createClassroom.isPending ||
              !selectedSchoolId ||
              !classroomForm.name ||
              !classroomForm.gradeLevel
            }
          >
            Create Classroom
          </Button>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="selectedClassroom">
              Active classroom
            </label>
            <select
              id="selectedClassroom"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={selectedClassroomId}
              onChange={(event) => setSelectedClassroomId(event.target.value)}
            >
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} ({classroom.gradeLevel})
                </option>
              ))}
              {classrooms.length === 0 && <option value="">No classrooms yet</option>}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={studentForm.memberId}
              onChange={(event) =>
                setStudentForm((prev) => ({ ...prev, memberId: event.target.value }))
              }
            >
              <option value="">Create new student profile</option>
              {studentMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="New student name"
              value={studentForm.name}
              onChange={(event) =>
                setStudentForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={studentForm.role}
              onChange={(event) =>
                setStudentForm((prev) => ({
                  ...prev,
                  role: event.target.value as 'child' | 'teen',
                }))
              }
            >
              <option value="child">child</option>
              <option value="teen">teen</option>
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Student number"
              value={studentForm.studentNumber}
              onChange={(event) =>
                setStudentForm((prev) => ({ ...prev, studentNumber: event.target.value }))
              }
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
              value={studentForm.visibilityModeOverride}
              onChange={(event) =>
                setStudentForm((prev) => ({
                  ...prev,
                  visibilityModeOverride: event.target.value as EnterpriseVisibilityMode,
                }))
              }
            >
              {visibilityOptions.map((option) => (
                <option key={option} value={option}>
                  Visibility override: {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleAddStudent}
              disabled={addStudent.isPending || !selectedClassroomId}
            >
              Add Student
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportStudents}
              disabled={exportStudents.isPending || !selectedClassroomId}
            >
              Export CSV
            </Button>
          </div>

          <textarea
            className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
            value={bulkCsv}
            onChange={(event) => setBulkCsv(event.target.value)}
          />
          <Button
            onClick={handleImportStudents}
            disabled={importStudents.isPending || !selectedClassroomId}
          >
            Import Students CSV
          </Button>

          <div className="space-y-2 text-sm">
            {(studentsQuery.data?.students ?? []).map((student) => (
              <div key={student.id} className="rounded-md border border-gray-200 px-3 py-2">
                <div className="font-medium text-gray-900">{student.memberName}</div>
                <div className="text-gray-600">
                  #{student.studentNumber ?? 'N/A'} · role {student.memberRole} · visibility{' '}
                  {student.visibilityModeOverride ?? 'default'}
                </div>
              </div>
            ))}
            {(studentsQuery.data?.students ?? []).length === 0 && (
              <p className="text-gray-500">No students enrolled in this classroom yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Teacher Dashboard & Assignment Flow
          </h2>

          {classroomDashboardQuery.data && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Students</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {classroomDashboardQuery.data.studentCount}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {classroomDashboardQuery.data.completionRate}%
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {classroomDashboardQuery.data.submittedAssignments}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {classroomDashboardQuery.data.approvedAssignments}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
              placeholder="Assignment title"
              value={assignmentForm.title}
              onChange={(event) =>
                setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
            <textarea
              className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
              placeholder="Assignment description"
              value={assignmentForm.description}
              onChange={(event) =>
                setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={assignmentForm.assignmentType}
              onChange={(event) =>
                setAssignmentForm((prev) => ({
                  ...prev,
                  assignmentType: event.target.value as 'chore' | 'task' | 'homework',
                }))
              }
            >
              <option value="chore">chore</option>
              <option value="task">task</option>
              <option value="homework">homework</option>
            </select>
            <input
              type="datetime-local"
              className="rounded-md border border-gray-300 px-3 py-2"
              value={assignmentForm.dueAt}
              onChange={(event) =>
                setAssignmentForm((prev) => ({ ...prev, dueAt: event.target.value }))
              }
            />
            <input
              type="number"
              min={1}
              className="rounded-md border border-gray-300 px-3 py-2"
              value={assignmentForm.points}
              onChange={(event) =>
                setAssignmentForm((prev) => ({ ...prev, points: Number(event.target.value) || 1 }))
              }
            />
            <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={assignmentForm.requiresProof}
                onChange={(event) =>
                  setAssignmentForm((prev) => ({ ...prev, requiresProof: event.target.checked }))
                }
              />
              Requires proof
            </label>
          </div>

          <Button
            onClick={handleCreateAssignment}
            disabled={
              createAssignment.isPending || !selectedClassroomId || !assignmentForm.title.trim()
            }
          >
            Assign Task
          </Button>

          <div className="space-y-3">
            {(assignmentsQuery.data?.assignments ?? []).map((assignment) => (
              <div key={assignment.id} className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">{assignment.title}</p>
                  <span className="text-xs text-gray-500">{assignment.points} pts</span>
                </div>
                <p className="text-sm text-gray-600">Due {formatDate(assignment.dueAt)}</p>
                <div className="mt-3 space-y-2">
                  {assignment.submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="rounded border border-gray-200 px-2 py-2 text-xs"
                    >
                      <p className="text-gray-700">
                        Student {submission.studentMemberId} · status {submission.status}
                      </p>
                      {submission.status === 'submitted' && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReviewSubmission(submission.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReviewSubmission(submission.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(assignmentsQuery.data?.assignments ?? []).length === 0 && (
              <p className="text-gray-500">No assignments yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">School Challenges</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
              placeholder="Challenge title"
              value={challengeForm.title}
              onChange={(event) =>
                setChallengeForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
            <textarea
              className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
              placeholder="Challenge description"
              value={challengeForm.description}
              onChange={(event) =>
                setChallengeForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={challengeForm.challengeType}
              onChange={(event) =>
                setChallengeForm((prev) => ({
                  ...prev,
                  challengeType: event.target.value as EnterpriseChallengeType,
                }))
              }
            >
              {challengeTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="rounded-md border border-gray-300 px-3 py-2"
              value={challengeForm.rewardPoints}
              onChange={(event) =>
                setChallengeForm((prev) => ({
                  ...prev,
                  rewardPoints: Number(event.target.value) || 1,
                }))
              }
            />
            <input
              type="datetime-local"
              className="rounded-md border border-gray-300 px-3 py-2"
              value={challengeForm.startsAt}
              onChange={(event) =>
                setChallengeForm((prev) => ({ ...prev, startsAt: event.target.value }))
              }
            />
            <input
              type="datetime-local"
              className="rounded-md border border-gray-300 px-3 py-2"
              value={challengeForm.endsAt}
              onChange={(event) =>
                setChallengeForm((prev) => ({ ...prev, endsAt: event.target.value }))
              }
            />
          </div>
          <Button
            onClick={handleCreateChallenge}
            disabled={
              createChallenge.isPending ||
              !selectedSchoolId ||
              !challengeForm.title ||
              !challengeForm.startsAt ||
              !challengeForm.endsAt
            }
          >
            Create Challenge
          </Button>

          <div className="space-y-2 text-sm">
            {(challengesQuery.data?.challenges ?? []).map((challenge) => (
              <div key={challenge.id} className="rounded-md border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{challenge.title}</p>
                <p className="text-gray-600">
                  {challenge.challengeType} · {challenge.status} · {formatDate(challenge.startsAt)}{' '}
                  to {formatDate(challenge.endsAt)}
                </p>
              </div>
            ))}
            {(challengesQuery.data?.challenges ?? []).length === 0 && (
              <p className="text-gray-500">No challenges created for this school.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">LMS Integrations</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={lmsForm.provider}
              onChange={(event) =>
                setLmsForm((prev) => ({
                  ...prev,
                  provider: event.target.value as EnterpriseLmsProvider,
                }))
              }
            >
              {lmsProviderOptions.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="External tenant ID"
              value={lmsForm.externalTenantId}
              onChange={(event) =>
                setLmsForm((prev) => ({ ...prev, externalTenantId: event.target.value }))
              }
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2"
              placeholder="Client ID"
              value={lmsForm.clientId}
              onChange={(event) =>
                setLmsForm((prev) => ({ ...prev, clientId: event.target.value }))
              }
            />
            <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={lmsForm.syncEnabled}
                onChange={(event) =>
                  setLmsForm((prev) => ({ ...prev, syncEnabled: event.target.checked }))
                }
              />
              Sync enabled
            </label>
          </div>
          <Button
            onClick={handleConfigureLms}
            disabled={configureLms.isPending || !selectedSchoolId}
          >
            Save Integration
          </Button>

          <div className="grid gap-2 sm:grid-cols-3">
            {lmsProviderOptions.map((provider) => (
              <Button
                key={provider}
                variant="secondary"
                onClick={() => handleSyncLms(provider)}
                disabled={syncLms.isPending || !selectedSchoolId}
              >
                Sync {provider}
              </Button>
            ))}
          </div>

          <div className="space-y-2 text-sm">
            {(lmsQuery.data?.integrations ?? []).map((integration) => (
              <div key={integration.id} className="rounded-md border border-gray-200 p-3">
                <p className="font-medium text-gray-900">{integration.provider}</p>
                <p className="text-gray-600">
                  Sync: {integration.syncEnabled ? 'enabled' : 'disabled'} · Last sync{' '}
                  {formatDate(integration.lastSyncedAt)}
                </p>
              </div>
            ))}
            {(lmsQuery.data?.integrations ?? []).length === 0 && (
              <p className="text-gray-500">No LMS integrations configured yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Parent Visibility Controls</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
              value={visibilityForm.studentMemberId}
              onChange={(event) =>
                setVisibilityForm((prev) => ({ ...prev, studentMemberId: event.target.value }))
              }
            >
              <option value="">Select student</option>
              {(studentsQuery.data?.students ?? []).map((student) => (
                <option key={student.memberId} value={student.memberId}>
                  {student.memberName}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 px-3 py-2"
              value={visibilityForm.visibilityMode}
              onChange={(event) =>
                setVisibilityForm((prev) => ({
                  ...prev,
                  visibilityMode: event.target.value as EnterpriseVisibilityMode,
                }))
              }
            >
              {visibilityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={visibilityForm.allowTeacherMessages}
                onChange={(event) =>
                  setVisibilityForm((prev) => ({
                    ...prev,
                    allowTeacherMessages: event.target.checked,
                  }))
                }
              />
              Teacher messages
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={visibilityForm.allowChallengeVisibility}
                onChange={(event) =>
                  setVisibilityForm((prev) => ({
                    ...prev,
                    allowChallengeVisibility: event.target.checked,
                  }))
                }
              />
              Challenge visibility for guardians
            </label>
          </div>

          <Button
            onClick={handleSetVisibility}
            disabled={
              setParentVisibility.isPending || !selectedSchoolId || !visibilityForm.studentMemberId
            }
          >
            Save Visibility
          </Button>

          <div className="space-y-2 text-sm">
            {(visibilityQuery.data?.visibility ?? []).map((row) => (
              <div key={row.id} className="rounded-md border border-gray-200 p-3">
                <p className="font-medium text-gray-900">Student {row.studentMemberId}</p>
                <p className="text-gray-600">
                  Mode {row.visibilityMode} · Teacher messages{' '}
                  {row.allowTeacherMessages ? 'on' : 'off'} · Challenges{' '}
                  {row.allowChallengeVisibility ? 'on' : 'off'}
                </p>
              </div>
            ))}
            {(visibilityQuery.data?.visibility ?? []).length === 0 && (
              <p className="text-gray-500">No explicit overrides configured.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>

          {schoolAnalyticsQuery.data && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Classrooms</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {schoolAnalyticsQuery.data.classroomCount}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Students</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {schoolAnalyticsQuery.data.studentCount}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Assignments</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {schoolAnalyticsQuery.data.assignmentCount}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Approval Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {schoolAnalyticsQuery.data.approvalRate}%
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleGenerateReport('pdf')}
              disabled={generateReport.isPending || !selectedSchoolId}
            >
              Download PDF Report
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleGenerateReport('excel')}
              disabled={generateReport.isPending || !selectedSchoolId}
            >
              Download Excel Report
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-md border border-gray-200 p-3">
              <p className="font-medium text-gray-900">Import History</p>
              <p className="text-gray-600">{importsQuery.data?.imports.length ?? 0} records</p>
            </div>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="font-medium text-gray-900">Audit Events</p>
              <p className="text-gray-600">{auditsQuery.data?.audits.length ?? 0} events</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Latest Import Jobs</h3>
          {(importsQuery.data?.imports ?? []).slice(0, 8).map((job) => (
            <div key={job.id} className="rounded-md border border-gray-200 p-3 text-sm">
              <p className="font-medium text-gray-900">
                {job.sourceFileName ?? 'manual-import.csv'}
              </p>
              <p className="text-gray-600">
                Rows {job.rowCount} · Success {job.successCount} · Errors {job.errorCount}
              </p>
              <p className="text-gray-500">{formatDate(job.importedAt)}</p>
            </div>
          ))}
          {(importsQuery.data?.imports ?? []).length === 0 && (
            <p className="text-gray-500">No bulk imports yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Admin Audit Trail</h3>
          {(auditsQuery.data?.audits ?? []).slice(0, 10).map((audit) => (
            <div key={audit.id} className="rounded-md border border-gray-200 p-3 text-sm">
              <p className="font-medium text-gray-900">{audit.eventType}</p>
              <p className="text-gray-600">
                Target {audit.targetType ?? 'unknown'} / {audit.targetId ?? 'n/a'}
              </p>
              <p className="text-gray-500">{formatDate(audit.createdAt)}</p>
            </div>
          ))}
          {(auditsQuery.data?.audits ?? []).length === 0 && (
            <p className="text-gray-500">No audit events yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
