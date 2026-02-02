import { useState } from 'react';
import {
  SkillTreeCard,
  SkillCard,
  MentorshipCard,
  CertificationBadge,
} from '../components/skill-building';
import {
  SkillTree,
  Skill,
  MemberSkillProgress,
  SkillCertification,
  MentorshipRelation,
  SkillCategory,
  MasteryLevel,
} from '@chorechamp/types';

type TabType = 'trees' | 'skills' | 'certifications' | 'mentorship' | 'challenges' | 'badges';

// Mock data
const mockSkillTrees: SkillTree[] = [
  {
    id: '1',
    householdId: 'h1',
    category: 'cooking' as SkillCategory,
    name: 'Cooking Basics',
    description: 'Learn essential cooking skills from meal prep to cleaning up',
    iconUrl: null,
    colorTheme: '#ef4444',
    totalSkills: 12,
    totalXp: 5000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    householdId: 'h1',
    category: 'cleaning' as SkillCategory,
    name: 'Home Cleaning',
    description: 'Master the art of keeping your home spotless and organized',
    iconUrl: null,
    colorTheme: '#3b82f6',
    totalSkills: 15,
    totalXp: 6000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    householdId: 'h1',
    category: 'laundry' as SkillCategory,
    name: 'Laundry Pro',
    description: 'From sorting to folding - become a laundry expert',
    iconUrl: null,
    colorTheme: '#06b6d4',
    totalSkills: 8,
    totalXp: 3000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockSkills: Skill[] = [
  {
    id: 's1',
    skillTreeId: '1',
    householdId: 'h1',
    name: 'Kitchen Safety',
    description: 'Learn knife handling, hot surface awareness, and food safety basics',
    iconUrl: null,
    level: 1,
    tier: 1,
    xpRequired: 100,
    prerequisites: [],
    ageMinimum: 8,
    estimatedPracticeTime: 30,
    videoTutorialUrl: 'https://example.com/kitchen-safety',
    articleUrl: null,
    tips: ['Always cut away from yourself', 'Keep handles turned inward'],
    safetyNotes: 'Adult supervision required for ages 8-12',
    linkedChoreIds: [],
    isCore: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 's2',
    skillTreeId: '1',
    householdId: 'h1',
    name: 'Basic Meal Prep',
    description: 'Washing, peeling, and chopping vegetables and fruits',
    iconUrl: null,
    level: 2,
    tier: 1,
    xpRequired: 200,
    prerequisites: ['s1'],
    ageMinimum: 10,
    estimatedPracticeTime: 45,
    videoTutorialUrl: null,
    articleUrl: null,
    tips: ['Start with soft vegetables', 'Use a sharp knife - its safer!'],
    safetyNotes: null,
    linkedChoreIds: [],
    isCore: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockProgress: MemberSkillProgress[] = [
  {
    id: 'p1',
    memberId: 'm1',
    skillId: 's1',
    householdId: 'h1',
    status: 'completed',
    masteryLevel: 'intermediate' as MasteryLevel,
    currentXp: 150,
    practiceCount: 8,
    totalPracticeMinutes: 240,
    lastPracticedAt: new Date('2025-01-28'),
    startedAt: new Date('2025-01-01'),
    completedAt: new Date('2025-01-20'),
    masteredAt: null,
    mentorId: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p2',
    memberId: 'm1',
    skillId: 's2',
    householdId: 'h1',
    status: 'in_progress',
    masteryLevel: 'beginner' as MasteryLevel,
    currentXp: 75,
    practiceCount: 3,
    totalPracticeMinutes: 90,
    lastPracticedAt: new Date('2025-01-30'),
    startedAt: new Date('2025-01-21'),
    completedAt: null,
    masteredAt: null,
    mentorId: 'm2',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCertifications: SkillCertification[] = [
  {
    id: 'c1',
    memberId: 'm1',
    skillId: 's1',
    householdId: 'h1',
    certificationName: 'Kitchen Safety Certified',
    status: 'certified',
    assessmentScore: 92,
    assessmentPassingScore: 70,
    assessmentAttempts: 1,
    certifiedAt: new Date('2025-01-20'),
    certifiedById: 'm2',
    expiresAt: null,
    certificateUrl: null,
    badgeIconUrl: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockMentorships: MentorshipRelation[] = [
  {
    id: 'men1',
    mentorId: 'm2',
    menteeId: 'm1',
    skillId: 's2',
    householdId: 'h1',
    status: 'active',
    sessionsCompleted: 3,
    totalSessionMinutes: 90,
    mentorXpEarned: 45,
    menteeXpEarned: 94,
    startedAt: new Date('2025-01-21'),
    completedAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function SkillBuilding() {
  const [activeTab, setActiveTab] = useState<TabType>('trees');
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'trees', label: 'Skill Trees', icon: '🌳' },
    { id: 'skills', label: 'My Skills', icon: '⭐' },
    { id: 'certifications', label: 'Certifications', icon: '📜' },
    { id: 'mentorship', label: 'Mentorship', icon: '👨‍🏫' },
    { id: 'challenges', label: 'Challenges', icon: '🎯' },
    { id: 'badges', label: 'Badges', icon: '🏅' },
  ];

  // Calculate stats
  const totalXp = mockProgress.reduce((sum, p) => sum + p.currentXp, 0);
  const completedSkills = mockProgress.filter(p => ['completed', 'mastered'].includes(p.status)).length;
  const certCount = mockCertifications.filter(c => c.status === 'certified').length;

  const getProgressForSkill = (skillId: string) => {
    return mockProgress.find(p => p.skillId === skillId) || null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skill Building</h1>
              <p className="text-sm text-gray-500">Learn life skills and earn certifications</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
              <div className="text-sm opacity-80">Total XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{mockProgress.length}</div>
              <div className="text-sm opacity-80">Skills Started</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completedSkills}</div>
              <div className="text-sm opacity-80">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{certCount}</div>
              <div className="text-sm opacity-80">Certifications</div>
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
                    ? 'border-purple-600 text-purple-600'
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
        {/* Skill Trees Tab */}
        {activeTab === 'trees' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Skill Categories</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockSkillTrees.map((tree) => (
                <SkillTreeCard
                  key={tree.id}
                  tree={tree}
                  skillsCompleted={2}
                  onSelect={() => {
                    setSelectedTree(tree.id);
                    setActiveTab('skills');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {selectedTree
                  ? mockSkillTrees.find(t => t.id === selectedTree)?.name || 'Skills'
                  : 'All Skills'}
              </h2>
              {selectedTree && (
                <button
                  onClick={() => setSelectedTree(null)}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  View All Trees
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockSkills
                .filter(s => !selectedTree || s.skillTreeId === selectedTree)
                .map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    progress={getProgressForSkill(skill.id)}
                    onStart={() => console.log('Start skill:', skill.id)}
                    onPractice={() => {
                      setSelectedSkill(skill);
                      setShowPracticeModal(true);
                    }}
                    onView={() => console.log('View skill:', skill.id)}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">My Certifications</h2>
            {mockCertifications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-4xl mb-4">📜</div>
                <h3 className="text-lg font-medium text-gray-900">No Certifications Yet</h3>
                <p className="text-gray-500 mt-1">Complete skills and pass assessments to earn certifications</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {mockCertifications.map((cert) => (
                  <CertificationBadge
                    key={cert.id}
                    certification={cert}
                    skillName={mockSkills.find(s => s.id === cert.skillId)?.name}
                    showDetails
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mentorship Tab */}
        {activeTab === 'mentorship' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Mentorship</h2>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Find a Mentor
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">As Mentee</h3>
                {mockMentorships.filter(m => m.menteeId === 'm1').length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg shadow text-gray-500">
                    No active mentorships
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mockMentorships
                      .filter(m => m.menteeId === 'm1')
                      .map((m) => (
                        <MentorshipCard
                          key={m.id}
                          mentorship={m}
                          memberNames={{ mentor: 'Parent', mentee: 'Alex' }}
                          skillName={mockSkills.find(s => s.id === m.skillId)?.name || 'Unknown'}
                          isMentor={false}
                        />
                      ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">As Mentor</h3>
                <div className="text-center py-8 bg-white rounded-lg shadow text-gray-500">
                  You can mentor others once you reach Advanced level in a skill
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Skill Challenges</h2>
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
              <p className="text-gray-500 mt-1">Skill challenges will be available as you progress</p>
            </div>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Skill Badges</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-4 gap-4">
                {['Kitchen Beginner', 'Safety First', 'Quick Learner', 'Practice Pro'].map((badge, i) => (
                  <div key={i} className={`text-center p-4 rounded-lg ${i < 2 ? 'bg-yellow-50' : 'bg-gray-100 opacity-50'}`}>
                    <div className="text-3xl mb-2">{i < 2 ? '🏅' : '🔒'}</div>
                    <div className={`text-sm font-medium ${i < 2 ? 'text-gray-900' : 'text-gray-400'}`}>{badge}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Practice Modal */}
      {showPracticeModal && selectedSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Log Practice Session</h2>
            <p className="text-gray-600 mb-4">Skill: {selectedSkill.name}</p>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input type="number" min="5" step="5" defaultValue="30" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      {'⭐'.repeat(rating)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea className="w-full border rounded-lg px-3 py-2" rows={3} placeholder="What did you practice?" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPracticeModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Log Practice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
