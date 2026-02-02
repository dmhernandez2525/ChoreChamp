import { useState, useEffect, useCallback } from 'react';
import { BookOpen, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Lightbulb, Star } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { AgeGuideline } from '@chorechamp/types';
import { AgeGroupBadge } from './AgeGroupBadge';

interface AgeGuidelinesProps {
  householdId: string;
  highlightAgeGroup?: string | null;
}

export function AgeGuidelines({ householdId, highlightAgeGroup }: AgeGuidelinesProps) {
  const [guidelines, setGuidelines] = useState<AgeGuideline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const loadGuidelines = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getAgeGuidelines(householdId);
      setGuidelines(data);
      // Expand highlighted group if provided
      if (highlightAgeGroup) {
        setExpandedGroups(new Set([highlightAgeGroup]));
      }
    } catch (err) {
      console.error('Failed to load guidelines:', err);
      setError(err instanceof Error ? err.message : 'Failed to load guidelines');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, highlightAgeGroup]);

  useEffect(() => {
    loadGuidelines();
  }, [loadGuidelines]);

  const toggleGroup = (ageGroup: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(ageGroup)) {
        next.delete(ageGroup);
      } else {
        next.add(ageGroup);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Age-Appropriate Chore Guidelines
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Developmentally appropriate tasks by age group
          </p>
        </div>
      </div>

      {/* Guidelines list */}
      <div className="space-y-3">
        {guidelines.map((guideline) => {
          const isExpanded = expandedGroups.has(guideline.ageGroup);
          const isHighlighted = highlightAgeGroup === guideline.ageGroup;

          return (
            <div
              key={guideline.ageGroup}
              className={`bg-white dark:bg-gray-800 rounded-lg border overflow-hidden transition-all ${
                isHighlighted
                  ? 'border-purple-300 dark:border-purple-700 ring-2 ring-purple-200 dark:ring-purple-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Header */}
              <button
                onClick={() => toggleGroup(guideline.ageGroup)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AgeGroupBadge ageGroup={guideline.ageGroup} />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {guideline.label}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({guideline.ageRange})
                  </span>
                  {isHighlighted && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  {/* Skills */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      Developmental Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {guideline.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sample chores */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Recommended Chores
                    </h4>
                    <ul className="grid grid-cols-2 gap-1 text-sm text-gray-600 dark:text-gray-400">
                      {guideline.sampleChores.map((chore, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full" />
                          {chore}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tips */}
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-500" />
                      Tips for Parents
                    </h4>
                    <ul className="space-y-1">
                      {guideline.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
