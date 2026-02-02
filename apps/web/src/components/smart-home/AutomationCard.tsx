import { cn } from '@chorechamp/ui';

interface AutomationTrigger {
  type: string;
  config: Record<string, unknown>;
}

interface AutomationAction {
  type: string;
  config: Record<string, unknown>;
  delay?: number;
}

interface SmartHomeAutomation {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  lastTriggeredAt: Date | null;
  triggerCount: number;
}

interface AutomationCardProps {
  automation: SmartHomeAutomation;
  onToggle?: (automationId: string, enabled: boolean) => void;
  onEdit?: (automationId: string) => void;
  onDelete?: (automationId: string) => void;
  onTest?: (automationId: string) => void;
  onTrigger?: (automationId: string) => void;
  className?: string;
}

const triggerIcons: Record<string, string> = {
  chore_completed: '✅',
  chore_assigned: '📋',
  streak_milestone: '🔥',
  level_up: '⬆️',
  badge_earned: '🏅',
  points_threshold: '🪙',
  time_schedule: '⏰',
  device_state_change: '📡',
};

const actionIcons: Record<string, string> = {
  device_control: '🎮',
  notification: '🔔',
  create_chore: '📝',
  award_bonus: '🎁',
  webhook: '🌐',
  delay: '⏳',
};

function getTriggerDescription(trigger: AutomationTrigger): string {
  const config = trigger.config as Record<string, unknown>;

  switch (trigger.type) {
    case 'chore_completed':
      return config.choreIds
        ? `When specific chores are completed`
        : `When any chore is completed`;
    case 'chore_assigned':
      return 'When a chore is assigned';
    case 'streak_milestone':
      return `When streak reaches ${config.streakDays} days`;
    case 'level_up':
      return config.targetLevel
        ? `When level ${config.targetLevel} is reached`
        : 'When leveling up';
    case 'badge_earned':
      return 'When a badge is earned';
    case 'points_threshold':
      return `When points reach ${config.threshold}`;
    case 'time_schedule':
      return `On schedule: ${config.cron}`;
    case 'device_state_change':
      return 'When device state changes';
    default:
      return trigger.type;
  }
}

function getActionDescription(action: AutomationAction): string {
  const config = action.config as Record<string, unknown>;

  switch (action.type) {
    case 'device_control':
      return `Control device`;
    case 'notification':
      return `Send notification: "${config.title}"`;
    case 'create_chore':
      return `Create a chore`;
    case 'award_bonus':
      return `Award ${config.pointsAmount} points`;
    case 'webhook':
      return `Call webhook`;
    case 'delay':
      return `Wait ${(config.durationMs as number) / 1000}s`;
    default:
      return action.type;
  }
}

export function AutomationCard({
  automation,
  onToggle,
  onEdit,
  onDelete,
  onTest,
  onTrigger,
  className,
}: AutomationCardProps) {
  const triggerIcon = triggerIcons[automation.trigger.type] || '⚡';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-all duration-200',
        automation.isEnabled
          ? 'border-green-200 hover:shadow-md'
          : 'border-gray-200 opacity-75',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{triggerIcon}</span>
          <div>
            <h3 className="font-medium text-gray-900">{automation.name}</h3>
            {automation.description && (
              <p className="text-sm text-gray-500">{automation.description}</p>
            )}
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => onToggle?.(automation.id, !automation.isEnabled)}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            automation.isEnabled ? 'bg-green-500' : 'bg-gray-300'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              automation.isEnabled ? 'left-6' : 'left-0.5'
            )}
          />
        </button>
      </div>

      {/* Trigger */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Trigger</div>
        <div className="text-sm text-gray-700">
          {getTriggerDescription(automation.trigger)}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Actions</div>
        <div className="space-y-1">
          {automation.actions.map((action, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
              <span>{actionIcons[action.type] || '▶️'}</span>
              <span>{getActionDescription(action)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span>Triggered {automation.triggerCount}x</span>
        {automation.lastTriggeredAt && (
          <span>
            Last: {new Date(automation.lastTriggeredAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onTrigger?.(automation.id)}
          disabled={!automation.isEnabled}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
            automation.isEnabled
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          Run Now
        </button>
        <button
          onClick={() => onTest?.(automation.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Test
        </button>
        <button
          onClick={() => onEdit?.(automation.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete?.(automation.id)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

interface AutomationListProps {
  automations: SmartHomeAutomation[];
  onToggle?: (automationId: string, enabled: boolean) => void;
  onEdit?: (automationId: string) => void;
  onDelete?: (automationId: string) => void;
  onTest?: (automationId: string) => void;
  onTrigger?: (automationId: string) => void;
  className?: string;
}

export function AutomationList({
  automations,
  onToggle,
  onEdit,
  onDelete,
  onTest,
  onTrigger,
  className,
}: AutomationListProps) {
  if (automations.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-4xl mb-4 block">🤖</span>
        <p className="text-gray-500">No automations yet</p>
        <p className="text-sm text-gray-400">
          Create automations to trigger actions when events happen
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {automations.map((automation) => (
        <AutomationCard
          key={automation.id}
          automation={automation}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onTest={onTest}
          onTrigger={onTrigger}
        />
      ))}
    </div>
  );
}
