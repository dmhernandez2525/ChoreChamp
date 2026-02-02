import { useState, useEffect } from 'react';
import { cn } from '@chorechamp/ui';
import { ChapterList } from '../components/story/ChapterCard';
import { QuestList } from '../components/story/QuestCard';
import { CharacterGallery } from '../components/story/CharacterGallery';
import { DialogueModal } from '../components/story/DialogueBox';

// Types
interface ChapterReward {
  xp: number;
  points: number;
  cardPackId: string | null;
  exclusiveCardId: string | null;
  characterUnlock: string | null;
  badgeId: string | null;
  title: string | null;
}

interface QuestReward {
  xp: number;
  points: number;
  cardPackId: string | null;
  specificCardId: string | null;
  badgeId: string | null;
  petItem: string | null;
  customReward: string | null;
}

interface QuestObjective {
  id: string;
  type: string;
  description: string;
  target: string | number;
  current: number;
  required: number;
  isCompleted: boolean;
}

interface StoryChapter {
  id: string;
  number: number;
  title: string;
  description: string;
  artwork: string;
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requiredLevel: number;
  rewards: ChapterReward;
  estimatedDuration: number;
}

interface ChapterProgress {
  chapterId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  questsCompleted: number;
  totalQuests: number;
  completionPercentage: number;
  starsEarned: number;
}

interface StoryQuest {
  id: string;
  chapterId: string;
  orderInChapter: number;
  title: string;
  description: string;
  briefing: string;
  debriefing: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  timeLimit: number | null;
  isOptional: boolean;
  isBonusQuest: boolean;
}

interface QuestProgress {
  questId: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  objectives: QuestObjective[];
  startedAt: Date | null;
  completedAt: Date | null;
  timeSpent: number;
}

interface StoryCharacter {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  personality: string;
  unlockCondition: string | null;
  isUnlocked: boolean;
}

interface StoryProgress {
  memberId: string;
  currentChapterId: string | null;
  currentQuestId: string | null;
  chaptersCompleted: number;
  questsCompleted: number;
  totalPlayTime: number;
  choicesMade: number;
  unlockedCharacters: string[];
  earnedTitles: string[];
}

interface DialogueLine {
  id: string;
  characterId: string;
  characterName: string;
  characterAvatar: string;
  text: string;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'excited' | 'worried';
  animation: 'none' | 'bounce' | 'shake' | 'fade' | 'slide';
  choices: Array<{
    id: string;
    text: string;
    nextDialogueId: string | null;
    effect: { type: string; target: string; value: number } | null;
    isCorrect: boolean | null;
  }> | null;
  delay: number;
}

interface StoryModeProps {
  memberId: string;
  householdId: string;
}

export function StoryMode({ memberId, householdId }: StoryModeProps) {
  const [activeTab, setActiveTab] = useState<'chapters' | 'characters' | 'progress'>('chapters');
  const [chapters, setChapters] = useState<Array<{ chapter: StoryChapter; progress: ChapterProgress }>>([]);
  const [characters, setCharacters] = useState<StoryCharacter[]>([]);
  const [storyProgress, setStoryProgress] = useState<StoryProgress | null>(null);
  const [memberLevel, setMemberLevel] = useState(1);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [chapterQuests, setChapterQuests] = useState<Array<{ quest: StoryQuest; progress: QuestProgress }>>([]);
  const [activeDialogue, setActiveDialogue] = useState<DialogueLine[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load story data
  useEffect(() => {
    loadStoryData();
  }, [memberId, householdId]);

  async function loadStoryData() {
    setIsLoading(true);
    try {
      // Load chapters
      const chaptersRes = await fetch(
        `/api/${householdId}/story/chapters?memberId=${memberId}&householdId=${householdId}`
      );
      if (chaptersRes.ok) {
        const data = await chaptersRes.json();
        setChapters(data.chapters);
        setMemberLevel(data.memberLevel);
      }

      // Load characters
      const charsRes = await fetch(`/api/${householdId}/story/characters?memberId=${memberId}`);
      if (charsRes.ok) {
        const data = await charsRes.json();
        setCharacters(data.characters);
      }

      // Load progress
      const progressRes = await fetch(
        `/api/${householdId}/story/progress?memberId=${memberId}&householdId=${householdId}`
      );
      if (progressRes.ok) {
        const data = await progressRes.json();
        setStoryProgress(data.progress);
      }
    } catch (error) {
      console.error('Failed to load story data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadChapterDetails(chapterId: string) {
    try {
      const res = await fetch(
        `/api/${householdId}/story/chapters/${chapterId}?memberId=${memberId}&householdId=${householdId}`
      );
      if (res.ok) {
        const data = await res.json();
        setChapterQuests(data.quests);
        setSelectedChapterId(chapterId);
      }
    } catch (error) {
      console.error('Failed to load chapter details:', error);
    }
  }

  async function handleStartQuest(questId: string) {
    try {
      const res = await fetch(`/api/${householdId}/story/quests/${questId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, householdId }),
      });

      if (res.ok) {
        const data = await res.json();

        // Show opening dialogue if any
        if (data.openingDialogue) {
          setActiveDialogue(data.openingDialogue.lines);
        }

        // Refresh quest list
        if (selectedChapterId) {
          loadChapterDetails(selectedChapterId);
        }
        loadStoryData();
      }
    } catch (error) {
      console.error('Failed to start quest:', error);
    }
  }

  async function handleContinueQuest(questId: string) {
    // Find the quest
    const questData = chapterQuests.find(q => q.quest.id === questId);
    if (!questData) return;

    // Navigate to quest view or show current state
    // For now, just show the briefing
    setActiveDialogue([
      {
        id: 'continue-briefing',
        characterId: 'system',
        characterName: 'Quest Log',
        characterAvatar: '',
        text: `Continue your quest: ${questData.quest.title}\n\n${questData.quest.briefing}`,
        emotion: 'neutral',
        animation: 'none',
        choices: null,
        delay: 0,
      },
    ]);
  }

  async function handleDialogueChoice(choiceId: string) {
    // Handle dialogue choice
    console.log('Choice made:', choiceId);
  }

  function handleDialogueComplete() {
    setActiveDialogue(null);
  }

  // Format play time
  function formatPlayTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading Story Mode...</p>
        </div>
      </div>
    );
  }

  const selectedChapter = chapters.find(c => c.chapter.id === selectedChapterId);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Story Mode</h1>
            <p className="text-white/80">
              Embark on an adventure and become a true Chore Champion!
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-1">📖</div>
            <div className="text-sm text-white/70">Level {memberLevel}</div>
          </div>
        </div>

        {/* Progress stats */}
        {storyProgress && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{storyProgress.chaptersCompleted}</div>
              <div className="text-xs text-white/70">Chapters</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{storyProgress.questsCompleted}</div>
              <div className="text-xs text-white/70">Quests</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{formatPlayTime(storyProgress.totalPlayTime)}</div>
              <div className="text-xs text-white/70">Play Time</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{storyProgress.choicesMade}</div>
              <div className="text-xs text-white/70">Choices</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'chapters', label: 'Chapters', icon: '📚' },
          { id: 'characters', label: 'Characters', icon: '👥' },
          { id: 'progress', label: 'Progress', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              setSelectedChapterId(null);
            }}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'chapters' && !selectedChapterId && (
        <ChapterList
          chapters={chapters}
          memberLevel={memberLevel}
          onSelectChapter={loadChapterDetails}
        />
      )}

      {activeTab === 'chapters' && selectedChapterId && selectedChapter && (
        <div>
          {/* Back button */}
          <button
            onClick={() => setSelectedChapterId(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <span>←</span>
            Back to Chapters
          </button>

          {/* Chapter header */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6">
            <div className="relative h-48">
              {selectedChapter.chapter.artwork ? (
                <img
                  src={selectedChapter.chapter.artwork}
                  alt={selectedChapter.chapter.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <div className="text-sm text-white/70 mb-1">
                  Chapter {selectedChapter.chapter.number}
                </div>
                <h2 className="text-2xl font-bold">{selectedChapter.chapter.title}</h2>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">{selectedChapter.chapter.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>~{selectedChapter.chapter.estimatedDuration} min</span>
                <span>•</span>
                <span className="capitalize">{selectedChapter.chapter.difficulty}</span>
                <span>•</span>
                <span>
                  {selectedChapter.progress.questsCompleted}/{selectedChapter.progress.totalQuests} quests
                </span>
              </div>
            </div>
          </div>

          {/* Quests */}
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quests</h3>
          <QuestList
            quests={chapterQuests}
            onStartQuest={handleStartQuest}
            onContinueQuest={handleContinueQuest}
          />
        </div>
      )}

      {activeTab === 'characters' && (
        <CharacterGallery characters={characters} />
      )}

      {activeTab === 'progress' && storyProgress && (
        <div className="space-y-6">
          {/* Titles earned */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Earned Titles</h3>
            {storyProgress.earnedTitles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {storyProgress.earnedTitles.map((title) => (
                  <span
                    key={title}
                    className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full text-sm font-medium"
                  >
                    {title}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Complete chapters to earn titles!</p>
            )}
          </div>

          {/* Chapter completion */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Chapter Progress</h3>
            <div className="space-y-4">
              {chapters.map(({ chapter, progress }) => (
                <div key={chapter.id} className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                      progress.status === 'completed' && 'bg-green-500 text-white',
                      progress.status === 'in_progress' && 'bg-yellow-500 text-white',
                      progress.status === 'available' && 'bg-indigo-500 text-white',
                      progress.status === 'locked' && 'bg-gray-300 text-gray-500'
                    )}
                  >
                    {progress.status === 'completed' ? '✓' : chapter.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{chapter.title}</span>
                      <span className="text-sm text-gray-500">
                        {progress.questsCompleted}/{progress.totalQuests}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          progress.status === 'completed' && 'bg-green-500',
                          progress.status === 'in_progress' && 'bg-yellow-500',
                          progress.status === 'available' && 'bg-indigo-500',
                          progress.status === 'locked' && 'bg-gray-300'
                        )}
                        style={{ width: `${progress.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  {progress.starsEarned > 0 && (
                    <div className="flex">
                      {[1, 2, 3].map((star) => (
                        <span
                          key={star}
                          className={star <= progress.starsEarned ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dialogue modal */}
      <DialogueModal
        isOpen={!!activeDialogue}
        lines={activeDialogue || []}
        onClose={handleDialogueComplete}
        onChoice={handleDialogueChoice}
      />
    </div>
  );
}

export default StoryMode;
