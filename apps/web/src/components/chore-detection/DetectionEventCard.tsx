import { cn } from '@chorechamp/ui';

interface DetectionEvent {
  id: string;
  ruleId: string;
  eventType: 'completion_detected' | 'need_detected' | 'false_positive';
  choreType: string;
  zoneName: string | null;
  sensorData: Record<string, unknown>;
  confidence: number;
  wasConfirmed: boolean | null;
  confirmedBy: string | null;
  pointsAwarded: number;
  createdAt: Date;
  processedAt: Date | null;
  rule?: {
    id: string;
    name: string;
  };
  device?: {
    id: string;
    name: string;
  };
}

interface DetectionEventCardProps {
  event: DetectionEvent;
  onConfirm?: (eventId: string, wasAccurate: boolean) => void;
  className?: string;
}

const choreTypeIcons: Record<string, string> = {
  vacuuming: '🧹',
  mopping: '🧼',
  dusting: '🪶',
  dishes: '🍽️',
  laundry: '👕',
  trash_out: '🗑️',
  bed_making: '🛏️',
  room_tidying: '🧺',
  bathroom_cleaning: '🚿',
  kitchen_cleaning: '🍳',
  pet_feeding: '🐕',
  plant_watering: '🌱',
  window_cleaning: '🪟',
  floor_sweeping: '🧹',
  surface_wiping: '🧽',
  custom: '⚙️',
};

const eventTypeConfig: Record<string, { label: string; color: string; icon: string }> = {
  completion_detected: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  need_detected: {
    label: 'Needs Attention',
    color: 'bg-orange-100 text-orange-800',
    icon: '⚠️',
  },
  false_positive: {
    label: 'False Positive',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
  },
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatChoreType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function DetectionEventCard({
  event,
  onConfirm,
  className,
}: DetectionEventCardProps) {
  const choreIcon = choreTypeIcons[event.choreType] || '📋';
  const eventConfig = eventTypeConfig[event.eventType];
  const isPending = event.wasConfirmed === null;

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-4 transition-all duration-200',
        isPending
          ? 'border-yellow-300 bg-yellow-50/30'
          : event.wasConfirmed
          ? 'border-green-200'
          : 'border-red-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{choreIcon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">
                {formatChoreType(event.choreType)}
              </h3>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  eventConfig.color
                )}
              >
                {eventConfig.icon} {eventConfig.label}
              </span>
            </div>
            {event.zoneName && (
              <p className="text-sm text-gray-500">{event.zoneName}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{formatDate(event.createdAt)}</div>
          <div className="text-xs text-gray-400">
            {event.confidence}% confidence
          </div>
        </div>
      </div>

      {/* Device and Rule Info */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        {event.device && (
          <span className="px-2 py-0.5 bg-gray-100 rounded-full">
            {event.device.name}
          </span>
        )}
        {event.rule && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
            {event.rule.name}
          </span>
        )}
      </div>

      {/* Sensor Data Preview */}
      <div className="bg-gray-50 rounded-lg p-2 mb-3 font-mono text-xs text-gray-600">
        {Object.entries(event.sensorData)
          .slice(0, 3)
          .map(([key, value]) => (
            <div key={key}>
              {key}: {String(value)}
            </div>
          ))}
        {Object.keys(event.sensorData).length > 3 && (
          <div className="text-gray-400">
            +{Object.keys(event.sensorData).length - 3} more...
          </div>
        )}
      </div>

      {/* Points Awarded */}
      {event.pointsAwarded > 0 && !isPending && (
        <div className="text-sm text-green-600 mb-3">
          +{event.pointsAwarded} bonus points awarded
        </div>
      )}

      {/* Confirmation Status / Actions */}
      {isPending ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-yellow-700">
            Awaiting confirmation
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => onConfirm?.(event.id, true)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => onConfirm?.(event.id, false)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full',
              event.wasConfirmed
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {event.wasConfirmed ? 'Confirmed' : 'Rejected'}
          </span>
          {event.processedAt && (
            <span className="text-gray-400">
              at {formatDate(event.processedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface DetectionEventListProps {
  events: DetectionEvent[];
  onConfirm?: (eventId: string, wasAccurate: boolean) => void;
  className?: string;
}

export function DetectionEventList({
  events,
  onConfirm,
  className,
}: DetectionEventListProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">📭</span>
        <p className="text-gray-500">No detection events yet</p>
        <p className="text-sm text-gray-400">
          Events will appear here when sensors detect chore activity
        </p>
      </div>
    );
  }

  // Group events by date
  const groupedEvents: Record<string, DetectionEvent[]> = {};
  for (const event of events) {
    const dateKey = new Date(event.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  }

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
          <div className="space-y-3">
            {dateEvents.map((event) => (
              <DetectionEventCard
                key={event.id}
                event={event}
                onConfirm={onConfirm}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface PendingDetectionsProps {
  events: DetectionEvent[];
  onConfirm?: (eventId: string, wasAccurate: boolean) => void;
  className?: string;
}

export function PendingDetections({
  events,
  onConfirm,
  className,
}: PendingDetectionsProps) {
  const pendingEvents = events.filter((e) => e.wasConfirmed === null);

  if (pendingEvents.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-yellow-50 rounded-xl p-4 border border-yellow-200', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔔</span>
        <h2 className="font-semibold text-yellow-800">
          {pendingEvents.length} Pending Confirmation{pendingEvents.length !== 1 ? 's' : ''}
        </h2>
      </div>
      <div className="space-y-3">
        {pendingEvents.slice(0, 5).map((event) => (
          <DetectionEventCard
            key={event.id}
            event={event}
            onConfirm={onConfirm}
          />
        ))}
        {pendingEvents.length > 5 && (
          <p className="text-sm text-yellow-700 text-center">
            +{pendingEvents.length - 5} more pending...
          </p>
        )}
      </div>
    </div>
  );
}
