import { cn } from '@chorechamp/ui';
import type { BossBattle } from '@chorechamp/types';
import { BossHealthBar } from './BossHealthBar';

interface BossCardProps {
  boss: BossBattle;
  className?: string;
}

function getTimeRemaining(endsAt: Date): string {
  const now = new Date();
  const end = new Date(endsAt);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Time expired!';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export function BossCard({ boss, className }: BossCardProps) {
  const isDefeated = boss.defeatedAt !== null;
  const isExpired = new Date(boss.endsAt) < new Date() && !isDefeated;
  const healthPercentage = (boss.healthCurrent / boss.healthMax) * 100;

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden shadow-lg',
        isDefeated ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-purple-700',
        className
      )}
    >
      {/* Header */}
      <div className="p-6 text-white">
        <div className="flex items-start gap-4">
          {/* Boss Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/20 text-5xl">
            {boss.icon}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{boss.name}</h2>
              {isDefeated && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                  DEFEATED!
                </span>
              )}
              {isExpired && (
                <span className="rounded-full bg-yellow-500/50 px-2 py-0.5 text-xs font-medium">
                  ESCAPED!
                </span>
              )}
            </div>
            <p className="mt-1 text-white/80">{boss.description}</p>

            {!isDefeated && !isExpired && (
              <p className="mt-2 text-sm text-white/70">
                ⏱️ {getTimeRemaining(boss.endsAt)}
              </p>
            )}
          </div>
        </div>

        {/* Health Bar */}
        {!isDefeated && (
          <div className="mt-6">
            <BossHealthBar
              current={boss.healthCurrent}
              max={boss.healthMax}
              size="lg"
              showLabel={false}
            />
            <div className="mt-2 flex justify-between text-sm text-white/80">
              <span>
                {isExpired ? 'Boss escaped!' : `${boss.healthCurrent} HP remaining`}
              </span>
              <span>
                {Math.round((1 - healthPercentage / 100) * 100)}% defeated
              </span>
            </div>
          </div>
        )}

        {/* Victory Message */}
        {isDefeated && (
          <div className="mt-6 rounded-lg bg-white/20 p-4 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="font-bold text-lg">Victory!</p>
            <p className="text-white/80 text-sm">
              Defeated on {new Date(boss.defeatedAt!).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Reward Banner */}
      <div className={cn('px-6 py-3', isDefeated ? 'bg-white/20' : 'bg-black/20')}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">
            {isDefeated ? 'Reward earned' : 'Victory reward'}
          </span>
          <span className="flex items-center gap-1 font-bold text-white">
            <span className="text-lg">⭐</span>
            {boss.pointReward} points
          </span>
        </div>
      </div>
    </div>
  );
}
