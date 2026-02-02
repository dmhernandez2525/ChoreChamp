import { cn } from '@chorechamp/ui';

interface DetectionCondition {
  sensorAttribute: string;
  operator: string;
  value: string | number | boolean;
  duration?: number;
}

interface DetectionRule {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  deviceId: string;
  sensorType: string;
  conditions: DetectionCondition[];
  conditionLogic: 'all' | 'any';
  choreType: string;
  zoneName: string | null;
  detectionMode: 'completion' | 'needed' | 'both';
  completionConfidence: number;
  requireManualConfirm: boolean;
  cooldownMinutes: number;
  bonusPointsOnAutoDetect: number;
  device?: {
    id: string;
    name: string;
    category: string;
  };
}

interface DetectionRuleCardProps {
  rule: DetectionRule;
  onToggle?: (ruleId: string, enabled: boolean) => void;
  onEdit?: (ruleId: string) => void;
  onDelete?: (ruleId: string) => void;
  onTest?: (ruleId: string) => void;
  className?: string;
}

const sensorTypeIcons: Record<string, string> = {
  motion: '🚶',
  contact: '🚪',
  humidity: '💧',
  temperature: '🌡️',
  air_quality: '💨',
  water_leak: '🌊',
  vibration: '📳',
  light: '💡',
  sound: '🔊',
  occupancy: '👥',
  vacuum_state: '🤖',
  appliance_state: '🔌',
  power_consumption: '⚡',
  camera_ai: '📷',
};

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

const operatorLabels: Record<string, string> = {
  equals: '=',
  not_equals: '≠',
  greater_than: '>',
  less_than: '<',
  greater_or_equal: '≥',
  less_or_equal: '≤',
  contains: 'contains',
  changed_to: '→',
  changed_from: '←',
  changed: 'changed',
  stayed_for: 'stayed for',
};

function formatCondition(condition: DetectionCondition): string {
  const operator = operatorLabels[condition.operator] || condition.operator;
  let value = String(condition.value);

  if (condition.operator === 'stayed_for' && condition.duration) {
    const minutes = Math.floor(condition.duration / 60);
    value = `${value} for ${minutes}m`;
  }

  return `${condition.sensorAttribute} ${operator} ${value}`;
}

export function DetectionRuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
  onTest,
  className,
}: DetectionRuleCardProps) {
  const sensorIcon = sensorTypeIcons[rule.sensorType] || '📡';
  const choreIcon = choreTypeIcons[rule.choreType] || '📋';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-all duration-200',
        rule.isEnabled
          ? 'border-blue-200 hover:shadow-md'
          : 'border-gray-200 opacity-75',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xl">{sensorIcon}</span>
            <span className="text-gray-400">→</span>
            <span className="text-xl">{choreIcon}</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{rule.name}</h3>
            {rule.description && (
              <p className="text-sm text-gray-500">{rule.description}</p>
            )}
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle?.(rule.id, !rule.isEnabled)}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            rule.isEnabled ? 'bg-blue-500' : 'bg-gray-300'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              rule.isEnabled ? 'left-6' : 'left-0.5'
            )}
          />
        </button>
      </div>

      {/* Device Info */}
      {rule.device && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
            {rule.device.name}
          </span>
          {rule.zoneName && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
              {rule.zoneName}
            </span>
          )}
        </div>
      )}

      {/* Conditions */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">
          Conditions ({rule.conditionLogic === 'all' ? 'All must match' : 'Any must match'})
        </div>
        <div className="space-y-1">
          {rule.conditions.map((condition, index) => (
            <div key={index} className="text-sm text-gray-700 font-mono">
              {formatCondition(condition)}
            </div>
          ))}
        </div>
      </div>

      {/* Detection Mode */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span
          className={cn(
            'px-2 py-1 rounded-full',
            rule.detectionMode === 'completion'
              ? 'bg-green-100 text-green-700'
              : rule.detectionMode === 'needed'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-purple-100 text-purple-700'
          )}
        >
          {rule.detectionMode === 'completion'
            ? 'Auto-Complete'
            : rule.detectionMode === 'needed'
            ? 'Suggest Needed'
            : 'Both'}
        </span>
        <span>Confidence: {rule.completionConfidence}%</span>
        <span>Cooldown: {rule.cooldownMinutes}m</span>
        {rule.bonusPointsOnAutoDetect > 0 && (
          <span className="text-green-600">+{rule.bonusPointsOnAutoDetect} pts</span>
        )}
      </div>

      {/* Confirmation Required Badge */}
      {rule.requireManualConfirm && (
        <div className="mb-3">
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
            Requires manual confirmation
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onTest?.(rule.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        >
          Test
        </button>
        <button
          onClick={() => onEdit?.(rule.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete?.(rule.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

interface DetectionRuleListProps {
  rules: DetectionRule[];
  onToggle?: (ruleId: string, enabled: boolean) => void;
  onEdit?: (ruleId: string) => void;
  onDelete?: (ruleId: string) => void;
  onTest?: (ruleId: string) => void;
  className?: string;
}

export function DetectionRuleList({
  rules,
  onToggle,
  onEdit,
  onDelete,
  onTest,
  className,
}: DetectionRuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">🔍</span>
        <p className="text-gray-500">No detection rules configured</p>
        <p className="text-sm text-gray-400">
          Set up rules to automatically detect when chores are completed
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {rules.map((rule) => (
        <DetectionRuleCard
          key={rule.id}
          rule={rule}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onTest={onTest}
        />
      ))}
    </div>
  );
}
