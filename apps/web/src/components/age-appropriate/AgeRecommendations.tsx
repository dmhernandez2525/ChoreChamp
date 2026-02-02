import { useState, useEffect, useCallback } from 'react';
import { Baby, Sparkles, AlertCircle, Plus, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { AgeRecommendations as AgeRecommendationsData, AgeAppropriateChore } from '@chorechamp/types';
import { AgeGroupBadge, SuitabilityBadge } from './AgeGroupBadge';

interface AgeRecommendationsProps {
  householdId: string;
  memberId: string;
  memberName: string;
  onAddChore?: (chore: AgeAppropriateChore) => void;
}

export function AgeRecommendations({
  householdId,
  memberId,
  memberName,
  onAddChore,
}: AgeRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<AgeRecommendationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getAgeRecommendations(householdId, memberId);
      setRecommendations(data);
      // Expand first two categories by default
      const firstTwo = data.recommendations.slice(0, 2).map((r) => r.category);
      setExpandedCategories(new Set(firstTwo));
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, memberId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
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
        <button
          onClick={loadRecommendations}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!recommendations) return null;

  // Filter to show only suitable chores unless "show all" is enabled
  const filteredRecommendations = recommendations.recommendations.map((category) => ({
    ...category,
    chores: showAll
      ? category.chores
      : category.chores.filter(
          (c) => c.suitability === 'perfect' || c.suitability === 'suitable' || c.suitability === 'challenging'
        ),
  })).filter((category) => category.chores.length > 0);

  const totalRecommended = filteredRecommendations.reduce((sum, c) => sum + c.chores.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recommended for {memberName}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Age {recommendations.memberAge}</span>
              <span>•</span>
              <AgeGroupBadge ageGroup={recommendations.ageGroup} size="sm" />
              <span>•</span>
              <span>{totalRecommended} chores</span>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
          />
          Show all ages
        </label>
      </div>

      {/* No recommendations */}
      {filteredRecommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Baby className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No chore recommendations available.</p>
          <p className="text-sm">All suitable chores may already be assigned.</p>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {filteredRecommendations.map((category) => (
          <div
            key={category.category}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Category header */}
            <button
              onClick={() => toggleCategory(category.category)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {category.category}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({category.chores.length} chores)
                </span>
              </div>
              {expandedCategories.has(category.category) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Chores list */}
            {expandedCategories.has(category.category) && (
              <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {category.chores.map((chore) => (
                  <div
                    key={chore.id}
                    className="p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    {/* Icon */}
                    <span className="text-2xl">{chore.icon}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {chore.title}
                        </h3>
                        <SuitabilityBadge suitability={chore.suitability} size="sm" />
                      </div>

                      {chore.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {chore.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{chore.pointValue} pts</span>
                        <span className="capitalize">{chore.difficulty}</span>
                        {chore.estimatedMinutes && <span>{chore.estimatedMinutes} min</span>}
                        {(chore.minAge || chore.maxAge) && (
                          <span>
                            Ages {chore.minAge || '?'}-{chore.maxAge || '?'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {chore.suitabilityMessage}
                      </p>
                    </div>

                    {/* Add button */}
                    {onAddChore && (
                      <button
                        onClick={() => onAddChore(chore)}
                        className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                        title="Add this chore"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
