import { useState } from 'react';
import {
  ReportCardCard,
  AcademicAchievementBadge,
  AcademicGoalCard,
  AttendanceCard,
  TrendChart,
} from '../components/report-cards';
import {
  ReportCard,
  ReportCardGrade,
  AcademicAchievement,
  AcademicGoal,
  AttendanceRecord,
  AcademicTrend,
  LETTER_GRADES,
  AcademicPeriodType,
} from '@chorechamp/types';

type TabType = 'cards' | 'achievements' | 'goals' | 'attendance' | 'trends' | 'settings';

// Mock data for demonstration
const mockReportCards: (ReportCard & { grades: ReportCardGrade[] })[] = [
  {
    id: '1',
    memberId: 'm1',
    householdId: 'h1',
    schoolYear: '2025-2026',
    periodType: 'quarter' as AcademicPeriodType,
    periodNumber: 2,
    periodName: 'Q2',
    issueDate: new Date('2025-12-15'),
    imageUrl: null,
    ocrProcessed: false,
    ocrRawText: null,
    gpa: 3.75,
    totalBonusEarned: 150,
    parentAcknowledged: false,
    parentAcknowledgedAt: null,
    parentAcknowledgedBy: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    grades: [
      { id: 'g1', reportCardId: '1', subjectId: null, subjectName: 'Mathematics', letterGrade: 'A', percentageGrade: 94, gpaValue: 4.0, credits: 1, teacherComments: null, previousGrade: 'B+', gradeImprovement: 0.7, bonusEarned: 18, createdAt: new Date() },
      { id: 'g2', reportCardId: '1', subjectId: null, subjectName: 'English', letterGrade: 'A-', percentageGrade: 91, gpaValue: 3.7, credits: 1, teacherComments: null, previousGrade: 'A-', gradeImprovement: 0, bonusEarned: 16, createdAt: new Date() },
      { id: 'g3', reportCardId: '1', subjectId: null, subjectName: 'Science', letterGrade: 'B+', percentageGrade: 88, gpaValue: 3.3, credits: 1, teacherComments: null, previousGrade: 'B', gradeImprovement: 0.3, bonusEarned: 14, createdAt: new Date() },
      { id: 'g4', reportCardId: '1', subjectId: null, subjectName: 'History', letterGrade: 'A', percentageGrade: 95, gpaValue: 4.0, credits: 1, teacherComments: null, previousGrade: 'B+', gradeImprovement: 0.7, bonusEarned: 18, createdAt: new Date() },
      { id: 'g5', reportCardId: '1', subjectId: null, subjectName: 'Art', letterGrade: 'A+', percentageGrade: 98, gpaValue: 4.0, credits: 0.5, teacherComments: null, previousGrade: 'A', gradeImprovement: 0.3, bonusEarned: 20, createdAt: new Date() },
    ],
  },
];

const mockAchievements: AcademicAchievement[] = [
  {
    id: 'a1',
    memberId: 'm1',
    householdId: 'h1',
    achievementType: 'honor_roll',
    title: 'Honor Roll',
    description: 'Achieved Honor Roll with GPA of 3.75',
    iconUrl: null,
    schoolYear: '2025-2026',
    periodType: 'quarter',
    periodNumber: 2,
    reportCardId: '1',
    bonusEarned: 100,
    metadata: null,
    earnedAt: new Date('2025-12-15'),
    celebrationShown: false,
    createdAt: new Date(),
  },
  {
    id: 'a2',
    memberId: 'm1',
    householdId: 'h1',
    achievementType: 'improvement',
    title: 'Most Improved - Math',
    description: 'Improved Math grade from B+ to A',
    iconUrl: null,
    schoolYear: '2025-2026',
    periodType: 'quarter',
    periodNumber: 2,
    reportCardId: '1',
    bonusEarned: 50,
    metadata: null,
    earnedAt: new Date('2025-12-15'),
    celebrationShown: true,
    createdAt: new Date(),
  },
];

const mockGoals: AcademicGoal[] = [
  {
    id: 'goal1',
    memberId: 'm1',
    householdId: 'h1',
    goalType: 'gpa',
    targetValue: 3.8,
    targetGrade: null,
    subjectId: null,
    subjectName: null,
    schoolYear: '2025-2026',
    periodType: 'semester' as AcademicPeriodType,
    periodNumber: 1,
    currentProgress: 3.75,
    isAchieved: false,
    achievedAt: null,
    bonusOnAchievement: 200,
    deadline: new Date('2026-01-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'goal2',
    memberId: 'm1',
    householdId: 'h1',
    goalType: 'grade',
    targetValue: 4.0,
    targetGrade: 'A',
    subjectId: null,
    subjectName: 'Mathematics',
    schoolYear: '2025-2026',
    periodType: 'quarter' as AcademicPeriodType,
    periodNumber: 3,
    currentProgress: 4.0,
    isAchieved: true,
    achievedAt: new Date('2025-12-15'),
    bonusOnAchievement: 75,
    deadline: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockAttendance: AttendanceRecord[] = [
  {
    id: 'att1',
    memberId: 'm1',
    householdId: 'h1',
    schoolYear: '2025-2026',
    periodType: 'quarter' as AcademicPeriodType,
    periodNumber: 1,
    totalDays: 45,
    daysPresent: 44,
    daysAbsent: 1,
    daysExcused: 1,
    daysTardy: 2,
    attendancePercentage: 97.8,
    isPerfect: false,
    bonusEarned: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'att2',
    memberId: 'm1',
    householdId: 'h1',
    schoolYear: '2025-2026',
    periodType: 'quarter' as AcademicPeriodType,
    periodNumber: 2,
    totalDays: 44,
    daysPresent: 44,
    daysAbsent: 0,
    daysExcused: 0,
    daysTardy: 0,
    attendancePercentage: 100,
    isPerfect: true,
    bonusEarned: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockTrends: AcademicTrend[] = [
  { id: 't1', memberId: 'm1', householdId: 'h1', subjectId: null, subjectName: null, metricType: 'gpa', schoolYear: '2025-2026', periodType: 'quarter' as AcademicPeriodType, periodNumber: 1, value: 3.5, previousValue: null, changePercent: null, trendDirection: 'stable', createdAt: new Date() },
  { id: 't2', memberId: 'm1', householdId: 'h1', subjectId: null, subjectName: null, metricType: 'gpa', schoolYear: '2025-2026', periodType: 'quarter' as AcademicPeriodType, periodNumber: 2, value: 3.75, previousValue: 3.5, changePercent: 7.14, trendDirection: 'up', createdAt: new Date() },
];

export default function ReportCards() {
  const [activeTab, setActiveTab] = useState<TabType>('cards');
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [showAddReportCard, setShowAddReportCard] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'cards', label: 'Report Cards', icon: '\uD83D\uDCCB' },
    { id: 'achievements', label: 'Achievements', icon: '\uD83C\uDFC6' },
    { id: 'goals', label: 'Goals', icon: '\uD83C\uDFAF' },
    { id: 'attendance', label: 'Attendance', icon: '\uD83D\uDCC5' },
    { id: 'trends', label: 'Trends', icon: '\uD83D\uDCC8' },
    { id: 'settings', label: 'Settings', icon: '\u2699\uFE0F' },
  ];

  const handleAcknowledge = (cardId: string) => {
    console.log('Acknowledge report card:', cardId);
  };

  const handleCelebrate = (achievementId: string) => {
    console.log('Celebrate achievement:', achievementId);
  };

  // Calculate stats
  const totalBonusEarned = mockReportCards.reduce((sum, c) => sum + c.totalBonusEarned, 0) +
    mockAchievements.reduce((sum, a) => sum + a.bonusEarned, 0) +
    mockAttendance.reduce((sum, a) => sum + a.bonusEarned, 0);

  const avgGpa = mockReportCards.length > 0
    ? mockReportCards.reduce((sum, c) => sum + (c.gpa || 0), 0) / mockReportCards.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
              <p className="text-sm text-gray-500">Track academic progress and earn rewards</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
              <button
                onClick={() => setShowAddReportCard(true)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Report Card
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{mockReportCards.length}</div>
              <div className="text-sm opacity-80">Report Cards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{avgGpa.toFixed(2)}</div>
              <div className="text-sm opacity-80">Average GPA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{mockAchievements.length}</div>
              <div className="text-sm opacity-80">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">+{totalBonusEarned}</div>
              <div className="text-sm opacity-80">Bonus Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Report Cards Tab */}
        {activeTab === 'cards' && (
          <div className="space-y-6">
            {mockReportCards.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-4xl mb-4">{'\uD83D\uDCCB'}</div>
                <h3 className="text-lg font-medium text-gray-900">No Report Cards Yet</h3>
                <p className="text-gray-500 mt-1">Upload your first report card to start tracking progress</p>
                <button
                  onClick={() => setShowAddReportCard(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Report Card
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {mockReportCards.map((card) => (
                  <ReportCardCard
                    key={card.id}
                    reportCard={card}
                    memberName="Alex"
                    isParent={true}
                    onAcknowledge={() => handleAcknowledge(card.id)}
                    onView={() => console.log('View card:', card.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {mockAchievements.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-4xl mb-4">{'\uD83C\uDFC6'}</div>
                <h3 className="text-lg font-medium text-gray-900">No Achievements Yet</h3>
                <p className="text-gray-500 mt-1">Academic achievements will appear here as they are earned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {mockAchievements.map((achievement) => (
                  <AcademicAchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    showDetails
                    onCelebrate={() => handleCelebrate(achievement.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Academic Goals</h2>
              <button
                onClick={() => setShowAddGoal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Set New Goal
              </button>
            </div>
            {mockGoals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-4xl mb-4">{'\uD83C\uDFAF'}</div>
                <h3 className="text-lg font-medium text-gray-900">No Goals Set</h3>
                <p className="text-gray-500 mt-1">Set academic goals to motivate and track progress</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockGoals.map((goal) => (
                  <AcademicGoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => console.log('Edit goal:', goal.id)}
                    onDelete={() => console.log('Delete goal:', goal.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Attendance Records</h2>
            {mockAttendance.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-4xl mb-4">{'\uD83D\uDCC5'}</div>
                <h3 className="text-lg font-medium text-gray-900">No Attendance Records</h3>
                <p className="text-gray-500 mt-1">Attendance data will be added with report cards</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockAttendance.map((attendance) => (
                  <AttendanceCard key={attendance.id} attendance={attendance} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Academic Trends</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TrendChart
                trends={mockTrends.filter(t => t.metricType === 'gpa')}
                metricType="gpa"
                title="GPA Over Time"
              />
              <TrendChart
                trends={mockAttendance.map(a => ({
                  id: a.id,
                  memberId: a.memberId,
                  householdId: a.householdId,
                  subjectId: null,
                  subjectName: null,
                  metricType: 'attendance' as const,
                  schoolYear: a.schoolYear,
                  periodType: a.periodType as AcademicPeriodType,
                  periodNumber: a.periodNumber,
                  value: a.attendancePercentage,
                  previousValue: null,
                  changePercent: null,
                  trendDirection: 'stable' as const,
                  createdAt: a.createdAt,
                }))}
                metricType="attendance"
                title="Attendance Rate"
              />
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Bonus Configuration</h3>
              <p className="text-gray-500 mb-4">Configure how bonus points are calculated for grades</p>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Per Grade Bonus</h4>
                      <p className="text-sm text-gray-500">Award points for each grade A or higher</p>
                    </div>
                    <span className="text-blue-600 font-medium">+10 pts base</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">GPA Threshold Bonus</h4>
                      <p className="text-sm text-gray-500">Bonus for achieving GPA above 3.5</p>
                    </div>
                    <span className="text-blue-600 font-medium">+50 pts</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Perfect Attendance</h4>
                      <p className="text-sm text-gray-500">Bonus for perfect attendance each period</p>
                    </div>
                    <span className="text-blue-600 font-medium">+50 pts</span>
                  </div>
                </div>
              </div>

              <button className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Edit Bonus Rules
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Honor Roll Configuration</h3>
              <p className="text-gray-500 mb-4">Set up honor roll levels and rewards</p>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{'\uD83C\uDFC6'}</span>
                      <div>
                        <h4 className="font-medium text-yellow-800">Honor Roll</h4>
                        <p className="text-sm text-yellow-600">GPA 3.5 or higher</p>
                      </div>
                    </div>
                    <span className="text-yellow-700 font-medium">+100 pts</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{'\u2B50'}</span>
                      <div>
                        <h4 className="font-medium text-purple-800">Principal's List</h4>
                        <p className="text-sm text-purple-600">GPA 3.8+ with no grades below B</p>
                      </div>
                    </div>
                    <span className="text-purple-700 font-medium">+200 pts</span>
                  </div>
                </div>
              </div>

              <button className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Edit Honor Roll Levels
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add Report Card Modal placeholder */}
      {showAddReportCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Report Card</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
                  <input type="text" placeholder="2025-2026" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Type</label>
                  <select className="w-full border rounded-lg px-3 py-2">
                    <option value="quarter">Quarter</option>
                    <option value="trimester">Trimester</option>
                    <option value="semester">Semester</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-gray-500">Drag and drop or click to upload report card image</p>
                  <p className="text-sm text-gray-400 mt-1">OCR will extract grades automatically</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grades</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Subject" className="flex-1 border rounded-lg px-3 py-2" />
                    <select className="w-24 border rounded-lg px-3 py-2">
                      {LETTER_GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <button type="button" className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">Remove</button>
                  </div>
                </div>
                <button type="button" className="mt-2 text-blue-600 hover:text-blue-700 text-sm">
                  + Add Subject
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddReportCard(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Report Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal placeholder */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Set Academic Goal</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Type</label>
                <select className="w-full border rounded-lg px-3 py-2">
                  <option value="gpa">GPA Goal</option>
                  <option value="grade">Grade Goal</option>
                  <option value="attendance">Attendance Goal</option>
                  <option value="honor_roll">Honor Roll</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
                <input type="number" step="0.01" placeholder="3.5" className="w-full border rounded-lg px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bonus on Achievement</label>
                <input type="number" placeholder="100" className="w-full border rounded-lg px-3 py-2" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
