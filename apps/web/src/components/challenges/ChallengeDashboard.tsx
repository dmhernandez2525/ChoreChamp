import { useState, useEffect, useCallback } from 'react';
import { Trophy, Plus, Users, Target, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { HouseholdChallengesOverview, FamilyChallenge } from '@chorechamp/types';
import { getChallengeProgress, getChallengeTimeRemaining, getChallengeStatusColor } from '@chorechamp/types';

interface ChallengeDashboardProps {
  householdId: string;
  onCreateChallenge?: () => void;
}

export function ChallengeDashboard({ householdId, onCreateChallenge }: ChallengeDashboardProps) {
  const [overview, setOverview] = useState<HouseholdChallengesOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getChallengesOverview(householdId);
      setOverview(data);
    } catch (err) {
      console.error('Failed to load challenges:', err);
      setError(err instanceof Error ? err.message : 'Failed to load challenges');
    } finally {
      setIsLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button onClick={loadOverview} className="mt-3 text-sm text-red-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Family Challenges
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Work together to achieve goals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadOverview}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={onCreateChallenge}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            New Challenge
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Trophy} label="Active" value={overview.activeChallenges.length} color="yellow" />
        <StatCard icon={Target} label="Completed" value={overview.stats.totalChallengesCompleted} color="green" />
        <StatCard icon={Users} label="Participation" value={`${overview.stats.averageParticipation}%`} color="blue" />
        <StatCard icon={Clock} label="Upcoming" value={overview.upcomingChallenges.length} color="purple" />
      </div>

      {/* Active challenges */}
      {overview.activeChallenges.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Active Challenges</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {overview.activeChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {overview.activeChallenges.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Trophy className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Active Challenges</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create a challenge to get started!</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: FamilyChallenge }) {
  const progress = getChallengeProgress(challenge);
  const timeRemaining = getChallengeTimeRemaining(challenge.endDate);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100">{challenge.title}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{challenge.description}</p>
        </div>
        <span
          className="px-2 py-1 text-xs font-medium rounded-full"
          style={{
            backgroundColor: `${getChallengeStatusColor(challenge.status)}20`,
            color: getChallengeStatusColor(challenge.status),
          }}
        >
          {challenge.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">
            {challenge.goal.current} / {challenge.goal.target} {challenge.goal.unit}
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{challenge.participants.length} participants</span>
        </div>
        {timeRemaining && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              {timeRemaining.days}d {timeRemaining.hours}h remaining
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
