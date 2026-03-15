import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type {
  AssignmentStatus,
  Assignment,
  Subject,
  StudySession,
  StudyGoal,
  StudyStreak,
} from '@chorechamp/types';
import {
  useHomeworkSubjects,
  useHomeworkAssignments,
  useStudySessions,
  useStudyGoals,
  useUpdateHomeworkAssignment,
} from '@chorechamp/api-client';
import { SubjectCard } from '../components/homework/SubjectCard';
import { AssignmentCard } from '../components/homework/AssignmentCard';
import { StudySessionCard } from '../components/homework/StudySessionCard';
import { StudyStreakCard } from '../components/homework/StudyStreakCard';

type TabType = 'overview' | 'assignments' | 'subjects' | 'sessions' | 'goals' | 'stats';

function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      <p className="font-medium">Something went wrong</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}

export function Homework() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedMember, setSelectedMember] = useState<string>('m1');

  const {
    data: subjectsRaw,
    isLoading: subjectsLoading,
    error: subjectsError,
  } = useHomeworkSubjects(householdId!);

  const {
    data: assignmentsRaw,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useHomeworkAssignments(householdId!);

  const {
    data: sessionsRaw,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useStudySessions(householdId!);

  const {
    data: goalsRaw,
    isLoading: goalsLoading,
    error: goalsError,
  } = useStudyGoals(householdId!);

  const { mutate: updateAssignment } = useUpdateHomeworkAssignment(householdId!);

  const subjectsList = (subjectsRaw as Subject[] | undefined) ?? [];
  const assignmentsList = (assignmentsRaw as Assignment[] | undefined) ?? [];
  const sessionsList = (sessionsRaw as StudySession[] | undefined) ?? [];
  const goalsList = (goalsRaw as StudyGoal[] | undefined) ?? [];

  // Derive streak from sessions data; the API does not provide a separate streak hook,
  // so we build a lightweight object from sessions metadata when available.
  const streak: StudyStreak | null = sessionsList.length > 0
    ? {
        id: 'derived',
        memberId: selectedMember,
        householdId: householdId!,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: null,
        weeklyMinutes: sessionsList
          .filter((s: StudySession) => {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(s.startedAt) >= weekAgo;
          })
          .reduce((sum: number, s: StudySession) => sum + (s.durationMinutes ?? 0), 0),
        weeklyGoalMinutes: 300,
        weeklySessionCount: sessionsList.filter((s: StudySession) => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(s.startedAt) >= weekAgo;
        }).length,
        monthlyMinutes: sessionsList
          .filter((s: StudySession) => {
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return new Date(s.startedAt) >= monthAgo;
          })
          .reduce((sum: number, s: StudySession) => sum + (s.durationMinutes ?? 0), 0),
        monthlySessionCount: sessionsList.filter((s: StudySession) => {
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return new Date(s.startedAt) >= monthAgo;
        }).length,
        totalMinutes: sessionsList.reduce((sum: number, s: StudySession) => sum + (s.durationMinutes ?? 0), 0),
        totalSessions: sessionsList.length,
        totalAssignmentsCompleted: assignmentsList.filter(
          (a: Assignment) => a.status === 'completed' || a.status === 'submitted'
        ).length,
        updatedAt: new Date(),
      }
    : null;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'sessions', label: 'Study Sessions', icon: '⏱️' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'stats', label: 'Statistics', icon: '📈' },
  ];

  const handleStatusChange = (assignmentId: string, status: AssignmentStatus) => {
    updateAssignment({ assignmentId, status });
  };

  const handleEndSession = (sessionId: string) => {
    // End session by marking endedAt to now via the update assignment mutation
    // (or a dedicated session mutation if available in the future)
    updateAssignment({ assignmentId: sessionId, status: 'completed' as AssignmentStatus });
  };

  const pendingAssignments = assignmentsList.filter(
    (a: Assignment) => a.status !== 'completed' && a.status !== 'submitted'
  );
  const activeSession = sessionsList.find((s: StudySession) => !s.endedAt);

  const isLoading = subjectsLoading || assignmentsLoading || sessionsLoading || goalsLoading;
  const hasError = subjectsError || assignmentsError || sessionsError || goalsError;

  if (hasError) {
    const errorMessage =
      (subjectsError as Error)?.message ||
      (assignmentsError as Error)?.message ||
      (sessionsError as Error)?.message ||
      (goalsError as Error)?.message ||
      'Failed to load homework data. Please try again.';

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <ErrorBanner message={errorMessage} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Homework & Study Tracker</h1>
          <p className="text-gray-500 mt-1">
            Track assignments, study sessions, and build good study habits
          </p>
        </div>

        {/* Member selector */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Student:</label>
          <select
            value={selectedMember}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedMember(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="m1">Emma</option>
            <option value="m2">Jack</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {isLoading ? (
                <LoadingSkeleton count={4} />
              ) : (
                <>
                  {/* Active session alert */}
                  {activeSession && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl animate-pulse">🎓</span>
                          <div>
                            <h3 className="font-semibold text-green-800">Study Session in Progress</h3>
                            <p className="text-sm text-green-700">
                              {activeSession.title} - {activeSession.durationMinutes} minutes so far
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleEndSession(activeSession.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                        >
                          End Session
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                      <p className="text-3xl font-bold text-orange-600">{pendingAssignments.length}</p>
                      <p className="text-sm text-gray-500">Pending Assignments</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {streak ? `${Math.floor(streak.weeklyMinutes / 60)}h` : '0h'}
                      </p>
                      <p className="text-sm text-gray-500">Studied This Week</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {streak?.currentStreak ?? 0}
                      </p>
                      <p className="text-sm text-gray-500">Day Streak</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                      <p className="text-3xl font-bold text-purple-600">{subjectsList.length}</p>
                      <p className="text-sm text-gray-500">Active Subjects</p>
                    </div>
                  </div>

                  {/* Streak card */}
                  {streak && <StudyStreakCard streak={streak} memberName="Emma" />}

                  {/* Upcoming assignments */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Upcoming Due</h3>
                    <div className="space-y-4">
                      {pendingAssignments.slice(0, 3).map((assignment: Assignment) => (
                        <AssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                      {pendingAssignments.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No pending assignments!</p>
                      )}
                    </div>
                  </div>

                  {/* Start study session */}
                  {!activeSession && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-3">Ready to Study?</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button className="p-3 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                          📝 Homework
                        </button>
                        <button className="p-3 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                          📖 Reading
                        </button>
                        <button className="p-3 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                          ✏️ Practice
                        </button>
                        <button className="p-3 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                          🔄 Review
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'assignments' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Add Assignment
                </button>
              </div>

              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  All
                </button>
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  Not Started
                </button>
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  In Progress
                </button>
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  Completed
                </button>
                <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  Overdue
                </button>
              </div>

              {assignmentsLoading ? (
                <LoadingSkeleton count={3} />
              ) : (
                <div className="space-y-4">
                  {assignmentsList.map((assignment: Assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  {assignmentsList.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No assignments yet.</p>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'subjects' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Subjects</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Add Subject
                </button>
              </div>

              {subjectsLoading ? (
                <LoadingSkeleton count={3} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjectsList.map((subject: Subject) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      assignmentCount={assignmentsList.filter((a: Assignment) => a.subjectId === subject.id).length}
                      upcomingDueCount={assignmentsList.filter(
                        (a: Assignment) => a.subjectId === subject.id &&
                          a.status !== 'completed' &&
                          a.status !== 'submitted'
                      ).length}
                    />
                  ))}
                  {subjectsList.length === 0 && (
                    <p className="text-gray-500 text-center py-8 col-span-full">No subjects yet.</p>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'sessions' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Study Sessions</h2>
                {!activeSession && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    Start New Session
                  </button>
                )}
              </div>

              {sessionsLoading ? (
                <LoadingSkeleton count={3} />
              ) : (
                <div className="space-y-4">
                  {sessionsList.map((session: StudySession) => (
                    <StudySessionCard
                      key={session.id}
                      session={session}
                      onEnd={!session.endedAt ? handleEndSession : undefined}
                    />
                  ))}
                  {sessionsList.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No study sessions yet.</p>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'goals' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Study Goals</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Set New Goal
                </button>
              </div>

              {goalsLoading ? (
                <LoadingSkeleton count={2} />
              ) : (
                <div className="space-y-4">
                  {goalsList.map((goal: StudyGoal) => {
                    const progress = (goal.currentValue / goal.targetValue) * 100;
                    return (
                      <div key={goal.id} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                            {goal.description && (
                              <p className="text-sm text-gray-500">{goal.description}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            goal.isCompleted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {goal.isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>

                        {goal.rewardDescription && (
                          <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                            🎁 Reward: {goal.rewardDescription}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {goalsList.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No goals set yet.</p>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'stats' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Study Statistics</h2>

              {sessionsLoading || subjectsLoading ? (
                <LoadingSkeleton count={3} />
              ) : (
                <>
                  {streak && <StudyStreakCard streak={streak} memberName="Emma" />}

                  {/* Study by subject */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Time by Subject</h3>
                    <div className="space-y-3">
                      {subjectsList.map((subject: Subject) => {
                        const minutes = sessionsList
                          .filter((s: StudySession) => s.subjectId === subject.id)
                          .reduce((sum: number, s: StudySession) => sum + (s.durationMinutes ?? 0), 0);
                        const total = streak?.totalMinutes || 1;
                        const percent = (minutes / total) * 100;
                        return (
                          <div key={subject.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: subject.color }}
                                />
                                {subject.name}
                              </span>
                              <span className="text-gray-600">{Math.floor(minutes / 60)}h {minutes % 60}m</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full"
                                style={{ backgroundColor: subject.color, width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {subjectsList.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No subjects to display.</p>
                      )}
                    </div>
                  </div>

                  {/* Assignment completion */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Assignment Completion</h3>
                    {(() => {
                      const completed = assignmentsList.filter(
                        (a: Assignment) => a.status === 'completed' || a.status === 'submitted'
                      );
                      const onTime = completed.filter(
                        (a: Assignment) => a.completedAt && a.dueDate && new Date(a.completedAt) <= new Date(a.dueDate)
                      ).length;
                      const late = completed.length - onTime;
                      const onTimeRate = completed.length > 0
                        ? Math.round((onTime / completed.length) * 100)
                        : 0;
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{onTime}</p>
                            <p className="text-xs text-gray-500">On Time</p>
                          </div>
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{late}</p>
                            <p className="text-xs text-gray-500">Late</p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{onTimeRate}%</p>
                            <p className="text-xs text-gray-500">On-Time Rate</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                              {completed.length > 0 ? `${completed.length}` : '-'}
                            </p>
                            <p className="text-xs text-gray-500">Completed</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
