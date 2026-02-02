import { useState } from 'react';
import { cn } from '@chorechamp/ui';
import type {
  CharacterProfile as CharacterProfileType,
  CharacterClass,
  CharacterClassDefinition,
  ClassSkillDefinition,
  MemberSkill,
  AvatarItem,
  LevelUnlock,
  XPTransaction,
} from '@chorechamp/types';
import { AvatarDisplay } from './AvatarDisplay';
import { LevelBadge } from './LevelBadge';
import { XPProgressBar } from './XPProgressBar';
import { StatsDisplay } from './StatsDisplay';
import { SkillTree } from './SkillTree';
import { AvatarBuilder } from './AvatarBuilder';
import { ClassSelector } from './ClassSelector';

interface CharacterProfileProps {
  profile: CharacterProfileType & {
    characterClass: CharacterClassDefinition;
    xpProgress: number;
    xpToNextLevel: number;
  };
  skills: (MemberSkill & { definition: ClassSkillDefinition })[];
  availableTitles: string[];
  nextUnlocks: LevelUnlock[];
  recentXP: XPTransaction[];
  allClasses: CharacterClassDefinition[];
  avatarItems: AvatarItem[];
  onUpdateAvatar: (avatar: CharacterProfileType['avatar']) => Promise<void>;
  onUpdateClass: (classId: CharacterClass) => Promise<void>;
  onAllocateStat: (stat: string, points: number) => Promise<void>;
  onSetTitle: (title: string | null) => Promise<void>;
  isParentOrSelf: boolean;
}

type Tab = 'overview' | 'avatar' | 'skills' | 'history';

const CLASS_ICONS: Record<CharacterClass, string> = {
  cleaner: '🧹',
  organizer: '📦',
  helper: '🤝',
  chef: '👨‍🍳',
  guardian: '🛡️',
};

export function CharacterProfile({
  profile,
  skills,
  availableTitles,
  nextUnlocks,
  recentXP,
  allClasses,
  avatarItems,
  onUpdateAvatar,
  onUpdateClass,
  onAllocateStat,
  onSetTitle,
  isParentOrSelf,
}: CharacterProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [showTitlePicker, setShowTitlePicker] = useState(false);

  const handleSaveAvatar = async (avatar: CharacterProfileType['avatar']) => {
    setIsSaving(true);
    try {
      await onUpdateAvatar(avatar);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeClass = async (classId: CharacterClass) => {
    setIsSaving(true);
    try {
      await onUpdateClass(classId);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAllocateStat = async (stat: string, points: number) => {
    setIsSaving(true);
    try {
      await onAllocateStat(stat, points);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-xl shadow-sm">
        {/* Avatar */}
        <div className="relative">
          <AvatarDisplay avatar={profile.avatar} size="xl" />
          <LevelBadge level={profile.level} size="lg" className="absolute -bottom-2 -right-2" />
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-2xl">{CLASS_ICONS[profile.characterClass.id as CharacterClass]}</span>
            <h2 className="text-2xl font-bold text-gray-900">
              {profile.characterClass.name}
            </h2>
          </div>

          {/* Title */}
          <button
            onClick={() => isParentOrSelf && setShowTitlePicker(true)}
            className={cn(
              'text-sm text-gray-500 hover:text-gray-700',
              isParentOrSelf && 'cursor-pointer underline-offset-2 hover:underline'
            )}
          >
            {profile.activeTitle || 'No title'}
            {isParentOrSelf && ' ✏️'}
          </button>

          {/* XP Progress */}
          <div className="mt-4 max-w-md">
            <XPProgressBar
              currentXP={profile.xpLifetime - (profile.xpLifetime - profile.xp)}
              xpNeeded={profile.xpToNextLevel + (profile.xpLifetime - profile.xp)}
              level={profile.level}
            />
          </div>

          {/* Quick Stats */}
          <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
            <div>
              <span className="text-gray-500">Lifetime XP:</span>{' '}
              <span className="font-semibold text-gray-700">{profile.xpLifetime.toLocaleString()}</span>
            </div>
            {profile.statPointsAvailable > 0 && (
              <div className="flex items-center gap-1 text-yellow-600">
                <span>✨</span>
                <span className="font-semibold">{profile.statPointsAvailable} stat points</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title Picker Modal */}
      {showTitlePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Choose Your Title</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSetTitle(null);
                  setShowTitlePicker(false);
                }}
                className={cn(
                  'p-2 rounded-lg border text-sm',
                  !profile.activeTitle
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                No Title
              </button>
              {availableTitles.map((title) => (
                <button
                  key={title}
                  onClick={() => {
                    onSetTitle(title);
                    setShowTitlePicker(false);
                  }}
                  className={cn(
                    'p-2 rounded-lg border text-sm',
                    profile.activeTitle === title
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {title}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTitlePicker(false)}
              className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['overview', 'avatar', 'skills', 'history'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Character Stats</h3>
              <StatsDisplay
                stats={profile.stats}
                statPointsAvailable={profile.statPointsAvailable}
                onAllocate={isParentOrSelf ? handleAllocateStat : undefined}
                isAllocating={isSaving}
              />
            </div>

            {/* Next Unlocks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Unlocks</h3>
              {nextUnlocks.length > 0 ? (
                <div className="space-y-2">
                  {nextUnlocks.map((unlock) => (
                    <div
                      key={unlock.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-xl">
                        {unlock.type === 'skill' && '⚔️'}
                        {unlock.type === 'avatar_item' && '👕'}
                        {unlock.type === 'title' && '🏷️'}
                        {unlock.type === 'ability' && '✨'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{unlock.name}</p>
                        <p className="text-sm text-gray-500">{unlock.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Keep leveling up to unlock more rewards!
                </p>
              )}

              {/* Class Change */}
              {isParentOrSelf && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Class</h3>
                  <ClassSelector
                    classes={allClasses}
                    selectedClass={profile.classId as CharacterClass}
                    onSelect={handleChangeClass}
                    disabled={isSaving}
                    cooldownEndsAt={profile.classChangedAt ? new Date(new Date(profile.classChangedAt).getTime() + 7 * 24 * 60 * 60 * 1000) : undefined}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'avatar' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Avatar</h3>
            {isParentOrSelf ? (
              <AvatarBuilder
                currentAvatar={profile.avatar}
                availableItems={avatarItems}
                unlockedItems={profile.unlockedItems || []}
                characterLevel={profile.level}
                onSave={handleSaveAvatar}
                isSaving={isSaving}
              />
            ) : (
              <div className="flex flex-col items-center py-8">
                <AvatarDisplay avatar={profile.avatar} size="xl" />
                <p className="mt-4 text-gray-500">
                  You can only customize your own avatar
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {profile.characterClass.name} Skills
            </h3>
            <SkillTree
              classSkills={profile.characterClass.skills}
              learnedSkills={skills}
              characterLevel={profile.level}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">XP History</h3>
            {recentXP.length > 0 ? (
              <div className="space-y-2">
                {recentXP.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {tx.description || formatTransactionType(tx.transactionType)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'font-semibold',
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount} XP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No XP transactions yet. Complete chores to earn XP!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTransactionType(type: string): string {
  const labels: Record<string, string> = {
    chore_completion: 'Chore Completed',
    streak_bonus: 'Streak Bonus',
    achievement_bonus: 'Achievement Bonus',
    daily_login: 'Daily Login',
    family_goal: 'Family Goal',
    boss_battle: 'Boss Battle',
    skill_use: 'Skill Used',
    manual_adjustment: 'Adjustment',
  };
  return labels[type] || type;
}
