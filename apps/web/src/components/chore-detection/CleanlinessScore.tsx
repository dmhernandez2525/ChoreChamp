import { cn } from '@chorechamp/ui';

interface SuggestedChore {
  choreType: string;
  urgency: 'low' | 'medium' | 'high';
  reason: string;
}

interface CleanlinessMetric {
  id: string;
  zoneName: string;
  overallScore: number;
  dustLevel: number | null;
  humidityLevel: number | null;
  lastMotionAt: Date | null;
  lastCleanedAt: Date | null;
  suggestedChores: SuggestedChore[];
  updatedAt: Date;
}

interface CleanlinessScoreProps {
  metric: CleanlinessMetric;
  onClick?: (zoneName: string) => void;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Spotless';
  if (score >= 80) return 'Very Clean';
  if (score >= 70) return 'Clean';
  if (score >= 60) return 'Fair';
  if (score >= 50) return 'Needs Attention';
  if (score >= 40) return 'Dirty';
  return 'Urgent';
}

const zoneIcons: Record<string, string> = {
  kitchen: '🍳',
  bathroom: '🚿',
  bedroom: '🛏️',
  living_room: '🛋️',
  dining_room: '🍽️',
  office: '💼',
  garage: '🚗',
  laundry: '👕',
  hallway: '🚪',
  basement: '📦',
  attic: '🏠',
  outdoor: '🌳',
  default: '🏠',
};

function getZoneIcon(zoneName: string): string {
  const lowerZone = zoneName.toLowerCase().replace(/\s+/g, '_');
  return zoneIcons[lowerZone] || zoneIcons.default;
}

function formatTimeSince(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

const urgencyColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export function CleanlinessScore({
  metric,
  onClick,
  className,
}: CleanlinessScoreProps) {
  const zoneIcon = getZoneIcon(metric.zoneName);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-all duration-200 hover:shadow-md cursor-pointer',
        className
      )}
      onClick={() => onClick?.(metric.zoneName)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{zoneIcon}</span>
          <h3 className="font-medium text-gray-900">{metric.zoneName}</h3>
        </div>
        <div className={cn('text-2xl font-bold', getScoreColor(metric.overallScore))}>
          {metric.overallScore}
        </div>
      </div>

      {/* Score Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{getScoreLabel(metric.overallScore)}</span>
          <span>{metric.overallScore}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getScoreBgColor(metric.overallScore))}
            style={{ width: `${metric.overallScore}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        {metric.dustLevel !== null && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>💨</span>
            <span>Dust: {metric.dustLevel.toFixed(0)}%</span>
          </div>
        )}
        {metric.humidityLevel !== null && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>💧</span>
            <span>Humidity: {metric.humidityLevel.toFixed(0)}%</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-gray-600">
          <span>🚶</span>
          <span>Motion: {formatTimeSince(metric.lastMotionAt)}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <span>🧹</span>
          <span>Cleaned: {formatTimeSince(metric.lastCleanedAt)}</span>
        </div>
      </div>

      {/* Suggested Chores */}
      {metric.suggestedChores && metric.suggestedChores.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-gray-500 mb-2">Suggested Tasks</div>
          <div className="flex flex-wrap gap-1">
            {metric.suggestedChores.slice(0, 3).map((chore, index) => (
              <span
                key={index}
                className={cn('text-xs px-2 py-0.5 rounded-full', urgencyColors[chore.urgency])}
                title={chore.reason}
              >
                {chore.choreType.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CleanlinessGridProps {
  metrics: CleanlinessMetric[];
  onZoneClick?: (zoneName: string) => void;
  className?: string;
}

export function CleanlinessGrid({
  metrics,
  onZoneClick,
  className,
}: CleanlinessGridProps) {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">🏠</span>
        <p className="text-gray-500">No zones configured</p>
        <p className="text-sm text-gray-400">
          Add detection rules with zones to track cleanliness
        </p>
      </div>
    );
  }

  // Sort by score (lowest first - needs attention)
  const sortedMetrics = [...metrics].sort((a, b) => a.overallScore - b.overallScore);

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {sortedMetrics.map((metric) => (
        <CleanlinessScore
          key={metric.id}
          metric={metric}
          onClick={onZoneClick}
        />
      ))}
    </div>
  );
}

interface CleanlinessSummaryProps {
  metrics: CleanlinessMetric[];
  className?: string;
}

export function CleanlinessSummary({
  metrics,
  className,
}: CleanlinessSummaryProps) {
  if (metrics.length === 0) {
    return null;
  }

  const averageScore =
    metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length;
  const zonesNeedingAttention = metrics.filter((m) => m.overallScore < 70);
  const urgentZones = metrics.filter((m) => m.overallScore < 50);
  const totalSuggestions = metrics.reduce(
    (sum, m) => sum + (m.suggestedChores?.length || 0),
    0
  );

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Home Cleanliness</h2>
        <div className="flex items-center gap-2">
          <span className="text-3xl">🏠</span>
          <span className="text-3xl font-bold">{Math.round(averageScore)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-2xl font-bold">{metrics.length}</div>
          <div className="text-sm text-white/80">Zones Tracked</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className={cn('text-2xl font-bold', zonesNeedingAttention.length > 0 && 'text-yellow-300')}>
            {zonesNeedingAttention.length}
          </div>
          <div className="text-sm text-white/80">Need Attention</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className={cn('text-2xl font-bold', urgentZones.length > 0 && 'text-red-300')}>
            {urgentZones.length}
          </div>
          <div className="text-sm text-white/80">Urgent</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-2xl font-bold">{totalSuggestions}</div>
          <div className="text-sm text-white/80">Suggestions</div>
        </div>
      </div>

      {urgentZones.length > 0 && (
        <div className="mt-4 bg-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <span>⚠️</span>
            <span>
              Urgent attention needed in: {urgentZones.map((z) => z.zoneName).join(', ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
