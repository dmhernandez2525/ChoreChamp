import { useState } from 'react';
import type {
  Subject,
  Assignment,
  StudySession,
  StudyStreak,
  StudyGoal,
  AssignmentStatus,
} from '@chorechamp/types';
import { SubjectCard } from '../components/homework/SubjectCard';
import { AssignmentCard } from '../components/homework/AssignmentCard';
import { StudySessionCard } from '../components/homework/StudySessionCard';
import { StudyStreakCard } from '../components/homework/StudyStreakCard';

type TabType = 'overview' | 'assignments' | 'subjects' | 'sessions' | 'goals' | 'stats';

// Mock data for demonstration
const mockSubjects: Subject[] = [
  {
    id: '1',
    householdId: 'h1',
    memberId: 'm1',
    name: 'Mathematics',
    shortName: 'Math',
    color: '#3B82F6',
    icon: null,
    teacherName: 'Mr. Johnson',
    roomNumber: '204',
    schedule: 'MWF 9:00 AM',
    targetGrade: 'A',
    currentGrade: 'B+',
    notifyBeforeClass: true,
    notifyMinutesBefore: 15,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    householdId: 'h1',
    memberId: 'm1',
    name: 'English',
    shortName: 'Eng',
    color: '#10B981',
    icon: null,
    teacherName: 'Ms. Williams',
    roomNumber: '108',
    schedule: 'TTh 10:30 AM',
    targetGrade: 'A',
    currentGrade: 'A-',
    notifyBeforeClass: true,
    notifyMinutesBefore: 15,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    householdId: 'h1',
    memberId: 'm1',
    name: 'Science',
    shortName: 'Sci',
    color: '#8B5CF6',
    icon: null,
    teacherName: 'Dr. Martinez',
    roomNumber: '312',
    schedule: 'MWF 1:00 PM',
    targetGrade: 'A',
    currentGrade: 'A',
    notifyBeforeClass: false,
    notifyMinutesBefore: 15,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockAssignments: (Assignment & { subject?: { id: string; name: string; color: string } })[] = [
  {
    id: 'a1',
    householdId: 'h1',
    memberId: 'm1',
    subjectId: '1',
    title: 'Chapter 5 Problems',
    description: 'Complete problems 1-25 from Chapter 5',
    instructions: null,
    assignmentType: 'homework',
    priority: 'high',
    status: 'in_progress',
    assignedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    completedAt: null,
    submittedAt: null,
    estimatedMinutes: 45,
    actualMinutes: null,
    maxPoints: 100,
    earnedPoints: null,
    grade: null,
    attachments: null,
    resourceLinks: null,
    pointsAwarded: null,
    screenTimeAwarded: null,
    notes: null,
    parentNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    subject: { id: '1', name: 'Mathematics', color: '#3B82F6' },
  },
  {
    id: 'a2',
    householdId: 'h1',
    memberId: 'm1',
    subjectId: '2',
    title: 'Book Report: To Kill a Mockingbird',
    description: 'Write a 3-page book report analyzing themes',
    instructions: null,
    assignmentType: 'essay',
    priority: 'urgent',
    status: 'not_started',
    assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    completedAt: null,
    submittedAt: null,
    estimatedMinutes: 120,
    actualMinutes: null,
    maxPoints: 150,
    earnedPoints: null,
    grade: null,
    attachments: null,
    resourceLinks: null,
    pointsAwarded: null,
    screenTimeAwarded: null,
    notes: null,
    parentNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    subject: { id: '2', name: 'English', color: '#10B981' },
  },
  {
    id: 'a3',
    householdId: 'h1',
    memberId: 'm1',
    subjectId: '3',
    title: 'Lab Report: Photosynthesis',
    description: 'Complete lab report from Wednesday experiment',
    instructions: null,
    assignmentType: 'project',
    priority: 'medium',
    status: 'completed',
    assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estimatedMinutes: 60,
    actualMinutes: 75,
    maxPoints: 100,
    earnedPoints: 95,
    grade: 'A',
    attachments: null,
    resourceLinks: null,
    pointsAwarded: 50,
    screenTimeAwarded: 15,
    notes: null,
    parentNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    subject: { id: '3', name: 'Science', color: '#8B5CF6' },
  },
];

const mockSessions: (StudySession & {
  subject?: { id: string; name: string; color: string } | null;
  assignment?: { id: string; title: string } | null;
})[] = [
  {
    id: 's1',
    householdId: 'h1',
    memberId: 'm1',
    subjectId: '1',
    assignmentId: 'a1',
    sessionType: 'homework',
    title: 'Math homework',
    startedAt: new Date(Date.now() - 30 * 60 * 1000),
    endedAt: null,
    durationMinutes: 30,
    plannedDurationMinutes: 45,
    breaksTaken: 0,
    focusScore: null,
    accomplishments: null,
    pagesCovered: null,
    problemsCompleted: null,
    productivityRating: null,
    difficultyRating: null,
    comprehensionRating: null,
    location: 'Home Office',
    studyMethod: 'Pomodoro Technique',
    pointsEarned: 0,
    bonusPointsEarned: 0,
    createdAt: new Date(),
    subject: { id: '1', name: 'Mathematics', color: '#3B82F6' },
    assignment: { id: 'a1', title: 'Chapter 5 Problems' },
  },
  {
    id: 's2',
    householdId: 'h1',
    memberId: 'm1',
    subjectId: '2',
    assignmentId: null,
    sessionType: 'reading',
    title: 'Reading: To Kill a Mockingbird',
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 - 45 * 60 * 1000),
    endedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    durationMinutes: 45,
    plannedDurationMinutes: 30,
    breaksTaken: 1,
    focusScore: 85,
    accomplishments: 'Read chapters 10-12',
    pagesCovered: 'pp. 112-156',
    problemsCompleted: null,
    productivityRating: 4,
    difficultyRating: 3,
    comprehensionRating: 5,
    location: 'Library',
    studyMethod: 'Active Reading',
    pointsEarned: 9,
    bonusPointsEarned: 2,
    createdAt: new Date(),
    subject: { id: '2', name: 'English', color: '#10B981' },
    assignment: null,
  },
];

const mockStreak: StudyStreak = {
  id: 'str1',
  memberId: 'm1',
  householdId: 'h1',
  currentStreak: 5,
  longestStreak: 12,
  lastStudyDate: new Date(),
  weeklyMinutes: 180,
  weeklyGoalMinutes: 300,
  weeklySessionCount: 6,
  monthlyMinutes: 720,
  monthlySessionCount: 24,
  totalMinutes: 3600,
  totalSessions: 120,
  totalAssignmentsCompleted: 45,
  updatedAt: new Date(),
};

const mockGoals: StudyGoal[] = [
  {
    id: 'g1',
    householdId: 'h1',
    memberId: 'm1',
    subjectId: null,
    title: 'Study 5 hours this week',
    description: 'Weekly study goal',
    goalType: 'weekly_minutes',
    targetValue: 300,
    currentValue: 180,
    periodType: 'weekly',
    startDate: new Date(),
    endDate: null,
    rewardPoints: 100,
    rewardScreenTime: 30,
    rewardDescription: '30 minutes bonus screen time',
    isCompleted: false,
    completedAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'g2',
    householdId: 'h1',
    memberId: 'm1',
    subjectId: '1',
    title: 'Maintain A in Math',
    description: 'Keep grade at A or above',
    goalType: 'grade_target',
    targetValue: 90,
    currentValue: 87,
    periodType: 'semester',
    startDate: new Date(),
    endDate: null,
    rewardPoints: 500,
    rewardScreenTime: 60,
    rewardDescription: 'Pizza party!',
    isCompleted: false,
    completedAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function Homework() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedMember, setSelectedMember] = useState<string>('m1');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'sessions', label: 'Study Sessions', icon: '⏱️' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'stats', label: 'Statistics', icon: '📈' },
  ];

  const handleStatusChange = (assignmentId: string, status: AssignmentStatus) => {
    console.log('Change status:', assignmentId, status);
  };

  const handleEndSession = (sessionId: string) => {
    console.log('End session:', sessionId);
  };

  const pendingAssignments = mockAssignments.filter(
    (a) => a.status !== 'completed' && a.status !== 'submitted'
  );
  const activeSession = mockSessions.find((s) => !s.endedAt);

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
            onChange={(e) => setSelectedMember(e.target.value)}
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
                  <p className="text-3xl font-bold text-blue-600">3h</p>
                  <p className="text-sm text-gray-500">Studied This Week</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{mockStreak.currentStreak}</p>
                  <p className="text-sm text-gray-500">Day Streak</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{mockSubjects.length}</p>
                  <p className="text-sm text-gray-500">Active Subjects</p>
                </div>
              </div>

              {/* Streak card */}
              <StudyStreakCard streak={mockStreak} memberName="Emma" />

              {/* Upcoming assignments */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Upcoming Due</h3>
                <div className="space-y-4">
                  {pendingAssignments.slice(0, 3).map((assignment) => (
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

              <div className="space-y-4">
                {mockAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockSubjects.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    assignmentCount={mockAssignments.filter((a) => a.subjectId === subject.id).length}
                    upcomingDueCount={mockAssignments.filter(
                      (a) => a.subjectId === subject.id &&
                        a.status !== 'completed' &&
                        a.status !== 'submitted'
                    ).length}
                  />
                ))}
              </div>
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

              <div className="space-y-4">
                {mockSessions.map((session) => (
                  <StudySessionCard
                    key={session.id}
                    session={session}
                    onEnd={!session.endedAt ? handleEndSession : undefined}
                  />
                ))}
              </div>
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

              <div className="space-y-4">
                {mockGoals.map((goal) => {
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
              </div>
            </>
          )}

          {activeTab === 'stats' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Study Statistics</h2>

              <StudyStreakCard streak={mockStreak} memberName="Emma" />

              {/* Study by subject */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Time by Subject</h3>
                <div className="space-y-3">
                  {mockSubjects.map((subject) => {
                    const minutes = Math.floor(Math.random() * 120) + 30;
                    const total = 300;
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
                </div>
              </div>

              {/* Assignment completion */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Assignment Completion</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">12</p>
                    <p className="text-xs text-gray-500">On Time</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">2</p>
                    <p className="text-xs text-gray-500">Late</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">92%</p>
                    <p className="text-xs text-gray-500">On-Time Rate</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">B+</p>
                    <p className="text-xs text-gray-500">Avg Grade</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
