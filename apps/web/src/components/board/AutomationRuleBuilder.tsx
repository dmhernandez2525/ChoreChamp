import { useState, useEffect } from 'react';
import { Zap, Settings } from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';

const TRIGGER_OPTIONS = [
  { value: 'chore_completed', label: 'Chore Completed' },
  { value: 'chore_created', label: 'Chore Created' },
  { value: 'due_date_passed', label: 'Due Date Passed' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'assigned', label: 'Chore Assigned' },
] as const;

const ACTION_OPTIONS = [
  { value: 'assign', label: 'Assign to Member' },
  { value: 'change_status', label: 'Change Status' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'set_priority', label: 'Set Priority' },
  { value: 'create_chore', label: 'Create Chore' },
] as const;

type TriggerType = typeof TRIGGER_OPTIONS[number]['value'];
type ActionType = typeof ACTION_OPTIONS[number]['value'];

interface AutomationRuleData {
  name: string;
  description: string;
  trigger: TriggerType;
  triggerConfig: Record<string, unknown>;
  action: ActionType;
  actionConfig: Record<string, unknown>;
  enabled: boolean;
}

interface AutomationRuleBuilderProps {
  initialData?: AutomationRuleData;
  onSave: (data: AutomationRuleData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

function TriggerConfigFields({
  trigger,
  config,
  onChange,
}: {
  trigger: TriggerType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const handlers: Record<TriggerType, () => JSX.Element> = {
    chore_completed: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Filter by tag (optional)
        </label>
        <input
          type="text"
          value={(config.tagFilter as string) ?? ''}
          onChange={(e) => onChange({ ...config, tagFilter: e.target.value })}
          placeholder="e.g. kitchen, daily"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
    chore_created: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Match title pattern (optional)
        </label>
        <input
          type="text"
          value={(config.titlePattern as string) ?? ''}
          onChange={(e) => onChange({ ...config, titlePattern: e.target.value })}
          placeholder="e.g. dishes, laundry"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
    due_date_passed: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Hours after due date
        </label>
        <input
          type="number"
          min={0}
          value={(config.hoursAfter as number) ?? 0}
          onChange={(e) => onChange({ ...config, hoursAfter: parseInt(e.target.value, 10) || 0 })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
    status_changed: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          From status (optional)
        </label>
        <input
          type="text"
          value={(config.fromStatus as string) ?? ''}
          onChange={(e) => onChange({ ...config, fromStatus: e.target.value })}
          placeholder="e.g. todo"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label className="block text-sm font-medium text-gray-700">
          To status (optional)
        </label>
        <input
          type="text"
          value={(config.toStatus as string) ?? ''}
          onChange={(e) => onChange({ ...config, toStatus: e.target.value })}
          placeholder="e.g. in_progress"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
    assigned: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Assigned to member ID (optional)
        </label>
        <input
          type="text"
          value={(config.memberId as string) ?? ''}
          onChange={(e) => onChange({ ...config, memberId: e.target.value })}
          placeholder="Leave blank for any member"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
  };

  const Handler = handlers[trigger];
  return Handler ? <Handler /> : null;
}

function ActionConfigFields({
  action,
  config,
  onChange,
}: {
  action: ActionType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const handlers: Record<ActionType, () => JSX.Element> = {
    assign: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Assign to member ID
        </label>
        <input
          type="text"
          value={(config.memberId as string) ?? ''}
          onChange={(e) => onChange({ ...config, memberId: e.target.value })}
          placeholder="Member UUID"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
    change_status: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          New status
        </label>
        <select
          value={(config.newStatus as string) ?? ''}
          onChange={(e) => onChange({ ...config, newStatus: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>
    ),
    add_tag: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tag name
        </label>
        <input
          type="text"
          value={(config.tagName as string) ?? ''}
          onChange={(e) => onChange({ ...config, tagName: e.target.value })}
          placeholder="e.g. urgent"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
    send_notification: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Notification message
        </label>
        <textarea
          value={(config.message as string) ?? ''}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
          placeholder="Notification text to send"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
    set_priority: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Priority level
        </label>
        <select
          value={(config.priority as string) ?? ''}
          onChange={(e) => onChange({ ...config, priority: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
    ),
    create_chore: () => (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Chore title
        </label>
        <input
          type="text"
          value={(config.choreTitle as string) ?? ''}
          onChange={(e) => onChange({ ...config, choreTitle: e.target.value })}
          placeholder="Title of the new chore"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <label className="block text-sm font-medium text-gray-700">
          Chore description (optional)
        </label>
        <textarea
          value={(config.choreDescription as string) ?? ''}
          onChange={(e) => onChange({ ...config, choreDescription: e.target.value })}
          placeholder="Description of the new chore"
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    ),
  };

  const Handler = handlers[action];
  return Handler ? <Handler /> : null;
}

export function AutomationRuleBuilder({
  initialData,
  onSave,
  onCancel,
  isSaving = false,
}: AutomationRuleBuilderProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [trigger, setTrigger] = useState<TriggerType>(initialData?.trigger ?? 'chore_completed');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(
    initialData?.triggerConfig ?? {}
  );
  const [action, setAction] = useState<ActionType>(initialData?.action ?? 'assign');
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>(
    initialData?.actionConfig ?? {}
  );
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true);

  // Reset configs when trigger/action type changes (only for new rules without initial data)
  useEffect(() => {
    if (!initialData) {
      setTriggerConfig({});
    }
  }, [trigger, initialData]);

  useEffect(() => {
    if (!initialData) {
      setActionConfig({});
    }
  }, [action, initialData]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || '',
      trigger,
      triggerConfig,
      action,
      actionConfig,
      enabled,
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-2">
        <Zap className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          {initialData ? 'Edit Rule' : 'New Automation Rule'}
        </h3>
      </div>

      {/* Name and Description */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Rule Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Auto-assign kitchen chores"
            maxLength={100}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this rule do?"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Two-column layout: Trigger and Action */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Trigger Column */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-500" />
            <h4 className="text-sm font-semibold text-gray-700">When (Trigger)</h4>
          </div>
          <div className="space-y-3">
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as TriggerType)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {TRIGGER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <TriggerConfigFields
              trigger={trigger}
              config={triggerConfig}
              onChange={setTriggerConfig}
            />
          </div>
        </div>

        {/* Action Column */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-gray-700">Then (Action)</h4>
          </div>
          <div className="space-y-3">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as ActionType)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ActionConfigFields
              action={action}
              config={actionConfig}
              onChange={setActionConfig}
            />
          </div>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            enabled ? 'bg-blue-600' : 'bg-gray-200'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              enabled ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
        <span className="text-sm text-gray-700">
          {enabled ? 'Rule is enabled' : 'Rule is disabled'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving || !name.trim()}>
          {isSaving ? 'Saving...' : initialData ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </div>
  );
}
