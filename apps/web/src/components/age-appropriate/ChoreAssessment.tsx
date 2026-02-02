import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import { AgeGroupBadge, SuitabilityBadge } from './AgeGroupBadge';

interface ChoreAssessmentProps {
  householdId: string;
  memberId: string;
  memberName: string;
}

interface AssessmentData {
  memberId: string;
  memberName: string;
  memberAge: number | null;
  ageGroup: string | null;
  assessments: Array<{
    choreId: string;
    choreTitle: string;
    choreIcon: string;
    category: string;
    difficulty: string;
    suitability: string;
    message: string;
  }>;
  summary: {
    perfect: number;
    suitable: number;
    challenging: number;
    tooYoung: number;
    tooEasy: number;
  };
}

export function ChoreAssessment({ householdId, memberId, memberName }: ChoreAssessmentProps) {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSuitability, setFilterSuitability] = useState<string | null>(null);

  const loadAssessment = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.bulkAssessChoresForMember(householdId, memberId);
      setAssessment(data);
    } catch (err) {
      console.error('Failed to load assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  }, [householdId, memberId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="grid grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
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
          onClick={loadAssessment}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!assessment) return null;

  if (assessment.memberAge === null) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
          <Info className="w-5 h-5" />
          <span>Set {memberName}'s birth year to see age-appropriate assessments</span>
        </div>
      </div>
    );
  }

  const filteredAssessments = filterSuitability
    ? assessment.assessments.filter((a) => a.suitability === filterSuitability)
    : assessment.assessments;

  const summaryItems = [
    { key: 'perfect', label: 'Perfect', count: assessment.summary.perfect, color: 'green' },
    { key: 'suitable', label: 'Suitable', count: assessment.summary.suitable, color: 'blue' },
    { key: 'challenging', label: 'Challenging', count: assessment.summary.challenging, color: 'amber' },
    { key: 'too_young', label: 'Too Young', count: assessment.summary.tooYoung, color: 'red' },
    { key: 'too_easy', label: 'Too Easy', count: assessment.summary.tooEasy, color: 'gray' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <ClipboardCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Chore Assessment for {memberName}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Age {assessment.memberAge}</span>
              <span>•</span>
              <AgeGroupBadge ageGroup={assessment.ageGroup} size="sm" />
              <span>•</span>
              <span>{assessment.assessments.length} chores</span>
            </div>
          </div>
        </div>

        <button
          onClick={loadAssessment}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Refresh assessment"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {summaryItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterSuitability(filterSuitability === item.key ? null : item.key)}
            className={`p-3 rounded-lg border text-center transition-all ${
              filterSuitability === item.key
                ? `bg-${item.color}-100 dark:bg-${item.color}-900/30 border-${item.color}-300 dark:border-${item.color}-700`
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <p className={`text-2xl font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
              {item.count}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Filter indicator */}
      {filterSuitability && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Showing:</span>
          <SuitabilityBadge suitability={filterSuitability} size="sm" />
          <button
            onClick={() => setFilterSuitability(null)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Assessments list */}
      {filteredAssessments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No chores match this filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {filteredAssessments.map((item) => (
            <div
              key={item.choreId}
              className="p-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/30"
            >
              <span className="text-xl">{item.choreIcon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.choreTitle}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.category} • {item.difficulty}
                </p>
              </div>
              <div className="text-right">
                <SuitabilityBadge suitability={item.suitability} size="sm" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] truncate">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
