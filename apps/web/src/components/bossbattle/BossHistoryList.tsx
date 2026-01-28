import type { BossBattle } from '@chorechamp/types';

interface BossHistoryListProps {
  bosses: BossBattle[];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function BossHistoryList({ bosses }: BossHistoryListProps) {
  const defeatedBosses = bosses.filter((b) => b.defeatedAt !== null);
  const escapedBosses = bosses.filter(
    (b) => b.defeatedAt === null && new Date(b.endsAt) < new Date()
  );

  if (bosses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <div className="text-4xl mb-2">⚔️</div>
        <p className="text-gray-600">No boss battles yet</p>
        <p className="text-sm text-gray-500">
          Complete chores together to challenge bosses!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900">Battle History</h3>
        <p className="text-sm text-gray-500">
          {defeatedBosses.length} defeated, {escapedBosses.length} escaped
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {bosses.map((boss) => {
          const isDefeated = boss.defeatedAt !== null;
          const isExpired = new Date(boss.endsAt) < new Date() && !isDefeated;

          return (
            <div key={boss.id} className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                {boss.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{boss.name}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(boss.startedAt)} - {formatDate(boss.endsAt)}
                </p>
              </div>

              <div className="text-right">
                {isDefeated ? (
                  <div>
                    <span className="text-green-600 font-medium">Victory!</span>
                    <p className="text-xs text-gray-500">+{boss.pointReward} pts</p>
                  </div>
                ) : isExpired ? (
                  <span className="text-red-600 font-medium">Escaped</span>
                ) : (
                  <span className="text-yellow-600 font-medium">In Progress</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
