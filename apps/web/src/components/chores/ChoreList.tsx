import { useMemo } from 'react';
import { ChoreCard } from './ChoreCard';
import { ChoreFilters, CompactChoreFilters } from './ChoreFilters';
import { ChoreListSkeleton } from '../common/LoadingSkeleton';
import { NoChoresEmptyState } from '../common/EmptyState';
import { useChoreStore, type ChoreFilter } from '../../stores/chore-store';
import type { TodayChore, Member, Chore, ChoreCompletion } from '@chorechamp/types';

interface ChoreListProps {
  chores: TodayChore[];
  members: Member[];
  isLoading?: boolean;
  onCompleteChore: (choreId: string) => void;
  isCompletingId?: string | null;
  compact?: boolean;
  showFilters?: boolean;
}

function getChoreStatus(
  chore: Chore,
  completion?: ChoreCompletion | null
): 'pending' | 'completed' | 'needs-approval' {
  if (!completion) return 'pending';
  if (completion.status === 'approved') return 'completed';
  if (chore.requiresApproval && completion.status === 'pending') return 'needs-approval';
  if (completion.status === 'pending' && !chore.requiresApproval) return 'completed';
  return 'pending';
}

const difficultyOrder = { trivial: 0, easy: 1, medium: 2, hard: 3 };

function sortChores(
  chores: TodayChore[],
  sortBy: ChoreFilter['sortBy'],
  sortOrder: ChoreFilter['sortOrder']
): TodayChore[] {
  return [...chores].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'dueTime':
        const timeA = a.chore.dueTime || '23:59';
        const timeB = b.chore.dueTime || '23:59';
        comparison = timeA.localeCompare(timeB);
        break;
      case 'points':
        comparison = a.chore.pointValue - b.chore.pointValue;
        break;
      case 'difficulty':
        const diffA = difficultyOrder[a.chore.difficulty as keyof typeof difficultyOrder] ?? 2;
        const diffB = difficultyOrder[b.chore.difficulty as keyof typeof difficultyOrder] ?? 2;
        comparison = diffA - diffB;
        break;
      case 'name':
        comparison = a.chore.title.localeCompare(b.chore.title);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

export function ChoreList({
  chores,
  members,
  isLoading,
  onCompleteChore,
  isCompletingId,
  compact = false,
  showFilters = true,
}: ChoreListProps) {
  const { filters, openChoreDetail } = useChoreStore();

  // Get unique categories from chores
  const categories = useMemo(() => {
    const cats = new Set(chores.map((c) => c.chore.category));
    return Array.from(cats).sort();
  }, [chores]);

  // Filter and sort chores
  const filteredChores = useMemo(() => {
    let result = chores;

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter((c) => {
        const status = getChoreStatus(c.chore, c.completion);
        return status === filters.status;
      });
    }

    // Filter by assignee
    if (filters.assignee !== 'all') {
      result = result.filter((c) => c.assignedTo === filters.assignee);
    }

    // Filter by category
    if (filters.category !== 'all') {
      result = result.filter((c) => c.chore.category === filters.category);
    }

    // Sort
    result = sortChores(result, filters.sortBy, filters.sortOrder);

    return result;
  }, [chores, filters]);

  // Get member by ID
  const getMember = (memberId: string) =>
    members.find((m) => m.id === memberId);

  if (isLoading) {
    return <ChoreListSkeleton count={compact ? 3 : 5} />;
  }

  if (chores.length === 0) {
    return <NoChoresEmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        compact ? (
          <CompactChoreFilters members={members} />
        ) : (
          <ChoreFilters members={members} categories={categories} />
        )
      )}

      {/* Results count */}
      {filteredChores.length !== chores.length && (
        <p className="text-sm text-gray-500">
          Showing {filteredChores.length} of {chores.length} chores
        </p>
      )}

      {/* Chore cards */}
      {filteredChores.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No chores match your filters
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChores.map((todayChore) => (
            <ChoreCard
              key={todayChore.id}
              chore={todayChore.chore}
              completion={todayChore.completion}
              assignee={getMember(todayChore.assignedTo)}
              onComplete={() => onCompleteChore(todayChore.chore.id)}
              onClick={() => openChoreDetail(todayChore.chore.id)}
              isCompletingId={isCompletingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Simplified list for dashboard preview
interface ChorePreviewListProps {
  chores: TodayChore[];
  members: Member[];
  onCompleteChore: (choreId: string) => void;
  isCompletingId?: string | null;
  maxItems?: number;
}

export function ChorePreviewList({
  chores,
  members,
  onCompleteChore,
  isCompletingId,
  maxItems = 5,
}: ChorePreviewListProps) {
  const { openChoreDetail } = useChoreStore();

  // Filter to incomplete chores and limit
  const pendingChores = useMemo(() => {
    return chores
      .filter((c) => {
        const status = getChoreStatus(c.chore, c.completion);
        return status === 'pending' || status === 'needs-approval';
      })
      .slice(0, maxItems);
  }, [chores, maxItems]);

  const getMember = (memberId: string) =>
    members.find((m) => m.id === memberId);

  if (pendingChores.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-gray-600 font-medium">All caught up!</p>
        <p className="text-sm text-gray-500">
          No pending chores for today
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingChores.map((todayChore) => (
        <ChoreCard
          key={todayChore.id}
          chore={todayChore.chore}
          completion={todayChore.completion}
          assignee={getMember(todayChore.assignedTo)}
          onComplete={() => onCompleteChore(todayChore.chore.id)}
          onClick={() => openChoreDetail(todayChore.chore.id)}
          isCompletingId={isCompletingId}
        />
      ))}
    </div>
  );
}
