import { ArrowRight, User, Check } from 'lucide-react';
import type { CalibrationSuggestion } from '@chorechamp/types';
import { DIFFICULTY_INFO } from '@chorechamp/types';

interface CalibrationSuggestionCardProps {
  suggestion: CalibrationSuggestion;
  isSelected: boolean;
  onToggle: () => void;
}

export function CalibrationSuggestionCard({
  suggestion,
  isSelected,
  onToggle,
}: CalibrationSuggestionCardProps) {
  const currentInfo = DIFFICULTY_INFO[suggestion.currentDifficulty];
  const suggestedInfo = DIFFICULTY_INFO[suggestion.suggestedDifficulty];

  return (
    <div
      onClick={onToggle}
      className={`p-4 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <div
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
            isSelected
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {suggestion.choreTitle}
            </h4>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                suggestion.confidence >= 80
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : suggestion.confidence >= 60
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {suggestion.confidence}% confidence
            </span>
          </div>

          {/* Difficulty change */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: currentInfo.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentInfo.label}
              </span>
            </div>

            <ArrowRight className="w-4 h-4 text-gray-400" />

            <div className="flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: suggestedInfo.color }}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {suggestedInfo.label}
              </span>
            </div>
          </div>

          {/* Points change */}
          <div className="flex items-center gap-2 text-sm mb-2">
            <span className="text-gray-500 dark:text-gray-400">
              {suggestion.currentPoints} pts
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span
              className={`font-medium ${
                suggestion.suggestedPoints > suggestion.currentPoints
                  ? 'text-green-600 dark:text-green-400'
                  : suggestion.suggestedPoints < suggestion.currentPoints
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {suggestion.suggestedPoints} pts
            </span>
            {suggestion.suggestedPoints !== suggestion.currentPoints && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({suggestion.suggestedPoints > suggestion.currentPoints ? '+' : ''}
                {suggestion.suggestedPoints - suggestion.currentPoints})
              </span>
            )}
          </div>

          {/* Reason */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {suggestion.reason}
          </p>

          {/* Member specific */}
          {suggestion.memberSpecific && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <User className="w-3 h-3" />
              <span>
                {suggestion.memberSpecific.memberName} -{' '}
                {suggestion.memberSpecific.performance === 'struggles'
                  ? 'having difficulty'
                  : suggestion.memberSpecific.performance === 'exceeds'
                  ? 'finding it easy'
                  : 'meeting expectations'}
              </span>
            </div>
          )}

          {/* Based on factors */}
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestion.basedOn.map((factor) => (
              <span
                key={factor}
                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
              >
                {factor.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
