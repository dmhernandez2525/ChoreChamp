import { Check, RefreshCw, Users, Calendar, Sparkles } from 'lucide-react';
import type { ScheduleSuggestion } from '@chorechamp/types';

interface ScheduleSuggestionCardProps {
  suggestion: ScheduleSuggestion;
  isSelected: boolean;
  onToggle: (id: string) => void;
  showAlternatives?: boolean;
  onSelectAlternative?: (suggestionId: string, memberId: string) => void;
  memberMap?: Map<string, { name: string; color: string }>;
}

const REASON_ICONS: Record<string, React.ReactNode> = {
  workload_balance: <RefreshCw className="w-3 h-3" />,
  pattern_match: <Sparkles className="w-3 h-3" />,
  age_appropriate: <Users className="w-3 h-3" />,
  availability: <Calendar className="w-3 h-3" />,
  rotation: <RefreshCw className="w-3 h-3" />,
  preference: <Check className="w-3 h-3" />,
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600 dark:text-green-400',
  medium: 'text-amber-600 dark:text-amber-400',
  low: 'text-red-600 dark:text-red-400',
};

function getConfidenceLevel(confidence: number): string {
  if (confidence >= 70) return 'high';
  if (confidence >= 40) return 'medium';
  return 'low';
}

export function ScheduleSuggestionCard({
  suggestion,
  isSelected,
  onToggle,
  showAlternatives = false,
  onSelectAlternative,
  memberMap,
}: ScheduleSuggestionCardProps) {
  const confidenceLevel = getConfidenceLevel(suggestion.confidence);
  const dateFormatted = new Date(suggestion.suggestedDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className={`relative rounded-lg border transition-all ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {/* Selection checkbox */}
      <button
        onClick={() => onToggle(suggestion.id)}
        className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
        }`}
      >
        {isSelected && <Check className="w-4 h-4" />}
      </button>

      <div className="p-4">
        {/* Chore info */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">{suggestion.choreIcon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 pr-8">
              {suggestion.choreTitle}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{suggestion.chorePoints} pts</span>
              <span>•</span>
              <span className="capitalize">{suggestion.choreDifficulty}</span>
            </div>
          </div>
        </div>

        {/* Assignment */}
        <div className="flex items-center gap-3 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {dateFormatted}
            {suggestion.suggestedTime && ` at ${suggestion.suggestedTime}`}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: suggestion.memberColor }}
          >
            {suggestion.memberName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {suggestion.memberName}
          </span>
        </div>

        {/* Reason */}
        <div className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-900 rounded-md px-2 py-1.5">
          <span className="text-indigo-500">{REASON_ICONS[suggestion.reason.type]}</span>
          <span className="text-gray-600 dark:text-gray-400">{suggestion.reason.message}</span>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Confidence</span>
          <span className={`font-medium ${CONFIDENCE_COLORS[confidenceLevel]}`}>
            {suggestion.confidence}%
          </span>
        </div>

        {/* Alternatives */}
        {showAlternatives && suggestion.alternativeMemberIds && suggestion.alternativeMemberIds.length > 0 && memberMap && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Alternative assignees:</p>
            <div className="flex flex-wrap gap-1">
              {suggestion.alternativeMemberIds.map((altId) => {
                const member = memberMap.get(altId);
                if (!member) return null;
                return (
                  <button
                    key={altId}
                    onClick={() => onSelectAlternative?.(suggestion.id, altId)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: member.color }}
                    />
                    <span className="text-gray-700 dark:text-gray-300">{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
