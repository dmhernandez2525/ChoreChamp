import { cn } from '@chorechamp/ui';
import type { ClassSkillDefinition, MemberSkill } from '@chorechamp/types';

interface SkillTreeProps {
  classSkills: ClassSkillDefinition[];
  learnedSkills: (MemberSkill & { definition: ClassSkillDefinition })[];
  characterLevel: number;
  onSkillClick?: (skill: ClassSkillDefinition) => void;
}

export function SkillTree({
  classSkills,
  learnedSkills,
  characterLevel,
  onSkillClick,
}: SkillTreeProps) {
  const isSkillLearned = (skillId: string) => {
    return learnedSkills.some((s) => s.skillId === skillId);
  };

  const isSkillAvailable = (skill: ClassSkillDefinition) => {
    return characterLevel >= skill.levelRequired;
  };

  const getSkillStatus = (skill: ClassSkillDefinition) => {
    if (isSkillLearned(skill.id)) return 'learned';
    if (isSkillAvailable(skill)) return 'available';
    return 'locked';
  };

  // Sort skills by level required
  const sortedSkills = [...classSkills].sort(
    (a, b) => a.levelRequired - b.levelRequired
  );

  return (
    <div className="space-y-4">
      {/* Skills List */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-3">
          {sortedSkills.map((skill) => {
            const status = getSkillStatus(skill);
            const learned = learnedSkills.find((s) => s.skillId === skill.id);

            return (
              <div key={skill.id} className="relative flex items-start gap-4">
                {/* Node */}
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl',
                    status === 'learned'
                      ? 'bg-green-500 border-green-600 text-white'
                      : status === 'available'
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : 'bg-gray-200 border-gray-300 text-gray-500'
                  )}
                >
                  {skill.icon}
                </div>

                {/* Skill Info */}
                <button
                  onClick={() => onSkillClick?.(skill)}
                  disabled={status === 'locked'}
                  className={cn(
                    'flex-1 rounded-lg border p-3 text-left transition-all',
                    status === 'learned'
                      ? 'bg-green-50 border-green-200'
                      : status === 'available'
                        ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{skill.name}</h4>
                    <span className="text-xs text-gray-500">
                      Lv. {skill.levelRequired}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {skill.description}
                  </p>

                  {/* Effects */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(skill.effects as Array<{ type: string; value: number }>).map((effect, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {formatEffect(effect)}
                      </span>
                    ))}
                  </div>

                  {/* Learned Info */}
                  {learned && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                      <span>✓ Learned</span>
                      <span className="text-gray-400">|</span>
                      <span>Level {learned.level}</span>
                    </div>
                  )}

                  {/* Locked Message */}
                  {status === 'locked' && (
                    <p className="mt-2 text-xs text-gray-400">
                      🔒 Unlocks at level {skill.levelRequired}
                    </p>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Learned</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-gray-300" />
          <span>Locked</span>
        </div>
      </div>
    </div>
  );
}

function formatEffect(effect: { type: string; value: number }): string {
  switch (effect.type) {
    case 'points_bonus':
      return `+${(effect.value * 100).toFixed(0)}% Points`;
    case 'xp_bonus':
      return `+${(effect.value * 100).toFixed(0)}% XP`;
    case 'streak_protection':
      return `+${effect.value} Streak Freeze`;
    case 'cooldown_reduction':
      return `-${(effect.value * 100).toFixed(0)}% Cooldown`;
    case 'team_buff':
      return `+${(effect.value * 100).toFixed(0)}% Team Buff`;
    default:
      return `+${effect.value}`;
  }
}
