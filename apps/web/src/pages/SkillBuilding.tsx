import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useSkillTrees,
  useSkillProgress,
  useSkillCertifications,
  useUpdateSkillProgress,
} from '@chorechamp/api-client';
import {
  SkillTreeCard,
  SkillCard,
  MentorshipCard,
  CertificationBadge,
} from '../components/skill-building';
import { Skeleton } from '../components/common';
import type {
  Skill,
  SkillTree,
  MemberSkillProgress,
  SkillCertification,
  MentorshipRelation,
} from '@chorechamp/types';

type TabType = 'trees' | 'skills' | 'certifications' | 'mentorship' | 'challenges' | 'badges';

export default function SkillBuilding() {
  const { householdId } = useParams<{ householdId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('trees');
  const [selectedTree, setSelectedTree] = useState<string | null>(null);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [practiceDuration, setPracticeDuration] = useState(30);
  const [practiceRating, setPracticeRating] = useState(0);
  const [practiceNotes, setPracticeNotes] = useState('');

  // API hooks
  const { data: skillTreesData, isLoading: loadingTrees, error: treesError } = useSkillTrees(householdId!);
  const { data: progressData, isLoading: loadingProgress, error: progressError } = useSkillProgress(householdId!);
  const { data: certificationsData, isLoading: loadingCerts, error: certsError } = useSkillCertifications(householdId!);
  const { mutate: updateProgress, isPending: isUpdating } = useUpdateSkillProgress(householdId!);

  const skillTreesTyped = skillTreesData as unknown as { trees?: SkillTree[]; skills?: Skill[] } | undefined;
  const skillTrees: SkillTree[] = skillTreesTyped?.trees ?? [];
  const skills: Skill[] = skillTreesTyped?.skills ?? [];
  const progress: MemberSkillProgress[] = (progressData ?? []) as MemberSkillProgress[];
  const certsTyped = certificationsData as unknown as { certifications?: SkillCertification[]; mentorships?: MentorshipRelation[] } | undefined;
  const certifications: SkillCertification[] = certsTyped?.certifications ?? [];
  const mentorships: MentorshipRelation[] = certsTyped?.mentorships ?? [];

  const isLoading = loadingTrees || loadingProgress || loadingCerts;
  const error = treesError || progressError || certsError;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'trees', label: 'Skill Trees', icon: '🌳' },
    { id: 'skills', label: 'My Skills', icon: '⭐' },
    { id: 'certifications', label: 'Certifications', icon: '📜' },
    { id: 'mentorship', label: 'Mentorship', icon: '👨‍🏫' },
    { id: 'challenges', label: 'Challenges', icon: '🎯' },
    { id: 'badges', label: 'Badges', icon: '🏅' },
  ];

  // Calculate stats
  const totalXp = progress.reduce((sum, p) => sum + p.currentXp, 0);
  const completedSkills = progress.filter(p => ['completed', 'mastered'].includes(p.status)).length;
  const certCount = certifications.filter(c => c.status === 'certified').length;

  const getProgressForSkill = (skillId: string) => {
    return progress.find(p => p.skillId === skillId) || null;
  };

  const handleStartSkill = (skillId: string) => {
    updateProgress({
      householdId: householdId!,
      skillId,
      action: 'start',
    });
  };

  const handleLogPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) return;

    updateProgress({
      householdId: householdId!,
      skillId: selectedSkill.id,
      action: 'practice',
      duration: practiceDuration,
      rating: practiceRating,
      notes: practiceNotes || undefined,
    });

    setShowPracticeModal(false);
    setPracticeDuration(30);
    setPracticeRating(0);
    setPracticeNotes('');
    setSelectedSkill(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12 bg-white rounded-lg shadow px-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900">Failed to load skill data</h3>
          <p className="text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

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
              {isLoading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1 bg-white/20 rounded" />
              ) : (
                <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
              )}
              <div className="text-sm opacity-80">Total XP</div>
            </div>
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1 bg-white/20 rounded" />
              ) : (
                <div className="text-2xl font-bold">{progress.length}</div>
              )}
              <div className="text-sm opacity-80">Skills Started</div>
            </div>
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1 bg-white/20 rounded" />
              ) : (
                <div className="text-2xl font-bold">{completedSkills}</div>
              )}
              <div className="text-sm opacity-80">Completed</div>
            </div>
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1 bg-white/20 rounded" />
              ) : (
                <div className="text-2xl font-bold">{certCount}</div>
              )}
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
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {skillTrees.map((tree) => {
                  const treeSkills = skills.filter(s => s.skillTreeId === tree.id);
                  const treeCompleted = treeSkills.filter(s =>
                    progress.some(p => p.skillId === s.id && ['completed', 'mastered'].includes(p.status))
                  ).length;
                  return (
                    <SkillTreeCard
                      key={tree.id}
                      tree={tree}
                      skillsCompleted={treeCompleted}
                      onSelect={() => {
                        setSelectedTree(tree.id);
                        setActiveTab('skills');
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {selectedTree
                  ? skillTrees.find(t => t.id === selectedTree)?.name || 'Skills'
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
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {skills
                  .filter(s => !selectedTree || s.skillTreeId === selectedTree)
                  .map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      progress={getProgressForSkill(skill.id)}
                      onStart={() => handleStartSkill(skill.id)}
                      onPractice={() => {
                        setSelectedSkill(skill);
                        setShowPracticeModal(true);
                      }}
                      onView={() => {
                        setSelectedSkill(skill);
                      }}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">My Certifications</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <Skeleton className="h-12 w-12 rounded-full mb-3" />
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : certifications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-4xl mb-4">📜</div>
                <h3 className="text-lg font-medium text-gray-900">No Certifications Yet</h3>
                <p className="text-gray-500 mt-1">Complete skills and pass assessments to earn certifications</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {certifications.map((cert) => (
                  <CertificationBadge
                    key={cert.id}
                    certification={cert}
                    skillName={skills.find(s => s.id === cert.skillId)?.name}
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

            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-5 w-24 mb-3" />
                    <div className="bg-white rounded-lg shadow p-6">
                      <Skeleton className="h-5 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">As Mentee</h3>
                  {mentorships.filter(m => m.menteeId === 'm1').length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg shadow text-gray-500">
                      No active mentorships
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mentorships
                        .filter(m => m.menteeId === 'm1')
                        .map((m) => (
                          <MentorshipCard
                            key={m.id}
                            mentorship={m}
                            memberNames={{ mentor: 'Parent', mentee: 'Alex' }}
                            skillName={skills.find(s => s.id === m.skillId)?.name || 'Unknown'}
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
            )}
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
            <form className="space-y-4" onSubmit={handleLogPractice}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={practiceDuration}
                  onChange={(e) => setPracticeDuration(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setPracticeRating(rating)}
                      className={`flex-1 py-2 border rounded-lg hover:bg-gray-50 ${
                        practiceRating === rating ? 'border-purple-600 bg-purple-50' : ''
                      }`}
                    >
                      {'⭐'.repeat(rating)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="What did you practice?"
                  value={practiceNotes}
                  onChange={(e) => setPracticeNotes(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowPracticeModal(false);
                    setSelectedSkill(null);
                    setPracticeDuration(30);
                    setPracticeRating(0);
                    setPracticeNotes('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Saving...' : 'Log Practice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
