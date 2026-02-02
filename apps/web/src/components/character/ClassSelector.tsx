import { cn } from '@chorechamp/ui';
import type { CharacterClass, CharacterClassDefinition } from '@chorechamp/types';

interface ClassSelectorProps {
  classes: CharacterClassDefinition[];
  selectedClass: CharacterClass | null;
  onSelect: (classId: CharacterClass) => void;
  disabled?: boolean;
  cooldownEndsAt?: Date;
}

const CLASS_COLORS: Record<CharacterClass, { bg: string; border: string; text: string }> = {
  cleaner: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-700' },
  organizer: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
  helper: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700' },
  chef: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  guardian: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700' },
};

const STAT_LABELS: Record<string, string> = {
  speed: 'Speed',
  quality: 'Quality',
  consistency: 'Consistency',
  teamwork: 'Teamwork',
};

export function ClassSelector({
  classes,
  selectedClass,
  onSelect,
  disabled = false,
  cooldownEndsAt,
}: ClassSelectorProps) {
  const showCooldown = cooldownEndsAt && new Date() < cooldownEndsAt;

  return (
    <div className="space-y-4">
      {showCooldown && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          <p>⏳ Class change on cooldown until:</p>
          <p className="font-medium">{cooldownEndsAt.toLocaleString()}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const colors = CLASS_COLORS[cls.id as CharacterClass];
          const isSelected = selectedClass === cls.id;

          return (
            <button
              key={cls.id}
              onClick={() => onSelect(cls.id as CharacterClass)}
              disabled={disabled || showCooldown}
              className={cn(
                'relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all',
                isSelected
                  ? cn(colors.bg, colors.border, 'ring-2 ring-offset-2', colors.border.replace('border-', 'ring-'))
                  : 'border-gray-200 bg-white hover:border-gray-300',
                (disabled || showCooldown) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-sm">
                  ✓
                </div>
              )}

              {/* Icon and Name */}
              <div className="flex items-center gap-3">
                <span className="text-4xl">{cls.icon}</span>
                <div>
                  <h3 className={cn('text-lg font-bold', isSelected ? colors.text : 'text-gray-900')}>
                    {cls.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Primary: {STAT_LABELS[cls.primaryStat]}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                {cls.description}
              </p>

              {/* Skills preview */}
              <div className="mt-3 w-full">
                <p className="text-xs font-medium text-gray-500 mb-1">Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {cls.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs"
                      title={skill.description}
                    >
                      <span>{skill.icon}</span>
                      <span className="text-gray-600">{skill.name}</span>
                    </span>
                  ))}
                  {cls.skills.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{cls.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
