import type { GamificationStats } from '@chorechamp/types';

interface StatsOverviewProps {
  stats: GamificationStats;
}

interface StatItemProps {
  icon: string;
  label: string;
  value: number | string;
  subValue?: string;
  color: string;
}

function StatItem({ icon, label, value, subValue, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </div>
  );
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatItem
        icon="🔥"
        label="Current Streak"
        value={stats.streakCurrent}
        subValue={`Best: ${stats.streakLongest} days`}
        color="bg-orange-100"
      />

      <StatItem
        icon="🏆"
        label="Badges Earned"
        value={`${stats.badgesEarned}/${stats.badgesTotal}`}
        color="bg-purple-100"
      />

      <StatItem
        icon="✅"
        label="Chores Today"
        value={stats.choresCompletedToday}
        subValue={`${stats.choresCompletedWeek} this week`}
        color="bg-green-100"
      />

      <StatItem
        icon="📊"
        label="Total Completed"
        value={stats.choresCompletedTotal}
        color="bg-blue-100"
      />
    </div>
  );
}
