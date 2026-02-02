import { cn } from '@chorechamp/ui';

interface Geofence {
  id: string;
  name: string;
  type: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string | null;
  isEnabled: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  totalEntries: number;
  totalExits: number;
  lastTriggeredAt: Date | null;
}

interface GeofenceCardProps {
  geofence: Geofence;
  membersInZone?: number;
  onEdit?: (geofenceId: string) => void;
  onDelete?: (geofenceId: string) => void;
  onToggle?: (geofenceId: string, enabled: boolean) => void;
  onClick?: (geofenceId: string) => void;
  className?: string;
}

const typeIcons: Record<string, string> = {
  home: '🏠',
  school: '🏫',
  work: '🏢',
  relative: '👨‍👩‍👧',
  activity: '⚽',
  friend: '👋',
  store: '🛒',
  custom: '📍',
};

const typeColors: Record<string, string> = {
  home: 'bg-green-100 text-green-700',
  school: 'bg-blue-100 text-blue-700',
  work: 'bg-purple-100 text-purple-700',
  relative: 'bg-pink-100 text-pink-700',
  activity: 'bg-orange-100 text-orange-700',
  friend: 'bg-cyan-100 text-cyan-700',
  store: 'bg-yellow-100 text-yellow-700',
  custom: 'bg-gray-100 text-gray-700',
};

function formatDate(date: Date | null): string {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function GeofenceCard({
  geofence,
  membersInZone = 0,
  onEdit,
  onDelete,
  onToggle,
  onClick,
  className,
}: GeofenceCardProps) {
  const icon = typeIcons[geofence.type] || '📍';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-all duration-200 hover:shadow-md',
        !geofence.isEnabled && 'opacity-60',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={() => onClick?.(geofence.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-medium text-gray-900">{geofence.name}</h3>
            {geofence.address && (
              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                {geofence.address}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(geofence.id, !geofence.isEnabled);
          }}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            geofence.isEnabled ? 'bg-green-500' : 'bg-gray-300'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              geofence.isEnabled ? 'left-6' : 'left-0.5'
            )}
          />
        </button>
      </div>

      {/* Type & Settings */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            typeColors[geofence.type] || typeColors.custom
          )}
        >
          {geofence.type}
        </span>
        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
          {geofence.radiusMeters}m radius
        </span>
        {geofence.notifyOnEntry && (
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
            Entry alerts
          </span>
        )}
        {geofence.notifyOnExit && (
          <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
            Exit alerts
          </span>
        )}
      </div>

      {/* Members in zone */}
      {membersInZone > 0 && (
        <div className="bg-green-50 rounded-lg p-2 mb-3 flex items-center gap-2">
          <span className="text-green-600 font-medium">
            {membersInZone} {membersInZone === 1 ? 'member' : 'members'} here
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span>{geofence.totalEntries} entries</span>
        <span>{geofence.totalExits} exits</span>
        <span>Last: {formatDate(geofence.lastTriggeredAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(geofence.id);
          }}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(geofence.id);
          }}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

interface GeofenceListProps {
  geofences: Geofence[];
  memberCounts?: Record<string, number>;
  onEdit?: (geofenceId: string) => void;
  onDelete?: (geofenceId: string) => void;
  onToggle?: (geofenceId: string, enabled: boolean) => void;
  onClick?: (geofenceId: string) => void;
  className?: string;
}

export function GeofenceList({
  geofences,
  memberCounts = {},
  onEdit,
  onDelete,
  onToggle,
  onClick,
  className,
}: GeofenceListProps) {
  if (geofences.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">📍</span>
        <p className="text-gray-500">No geofences configured</p>
        <p className="text-sm text-gray-400">
          Create zones to track family member locations
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {geofences.map((geofence) => (
        <GeofenceCard
          key={geofence.id}
          geofence={geofence}
          membersInZone={memberCounts[geofence.id] || 0}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
