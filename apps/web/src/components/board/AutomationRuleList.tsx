import { useState } from 'react';
import { Zap, Pencil, Trash2, Plus } from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';
import type { AutomationRule } from '../../lib/api';

const TRIGGER_LABELS: Record<string, string> = {
  chore_completed: 'Chore Completed',
  chore_created: 'Chore Created',
  due_date_passed: 'Due Date Passed',
  status_changed: 'Status Changed',
  assigned: 'Chore Assigned',
};

const ACTION_LABELS: Record<string, string> = {
  assign: 'Assign to Member',
  change_status: 'Change Status',
  add_tag: 'Add Tag',
  send_notification: 'Send Notification',
  set_priority: 'Set Priority',
  create_chore: 'Create Chore',
};

interface AutomationRuleListProps {
  rules: AutomationRule[];
  onEdit: (rule: AutomationRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string) => void;
  onCreate: () => void;
  isDeleting?: string | null;
}

export function AutomationRuleList({
  rules,
  onEdit,
  onDelete,
  onToggle,
  onCreate,
  isDeleting,
}: AutomationRuleListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (ruleId: string) => {
    if (confirmDeleteId === ruleId) {
      onDelete(ruleId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(ruleId);
    }
  };

  if (rules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <Zap className="mx-auto mb-3 h-10 w-10 text-gray-400" />
        <h3 className="mb-1 text-sm font-semibold text-gray-700">
          No automation rules yet
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          Create rules to automate repetitive tasks in your household.
        </p>
        <Button onClick={onCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Create Rule
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Automation Rules ({rules.length})
        </h3>
        <Button onClick={onCreate} size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {rules.map((rule) => (
        <div
          key={rule.id}
          className={cn(
            'rounded-lg border bg-white p-4 shadow-sm transition-opacity',
            !rule.enabled && 'opacity-60'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Zap
                  className={cn(
                    'h-4 w-4 shrink-0',
                    rule.enabled ? 'text-amber-500' : 'text-gray-400'
                  )}
                />
                <h4 className="truncate text-sm font-medium text-gray-900">
                  {rule.name}
                </h4>
              </div>
              {rule.description && (
                <p className="mt-1 text-xs text-gray-500">{rule.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  When: {TRIGGER_LABELS[rule.trigger] ?? rule.trigger}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Then: {ACTION_LABELS[rule.action] ?? rule.action}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Enable/Disable Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={rule.enabled}
                aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
                onClick={() => onToggle(rule.id)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  rule.enabled ? 'bg-blue-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                    rule.enabled ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => onEdit(rule)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Edit rule"
              >
                <Pencil className="h-4 w-4" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => handleDelete(rule.id)}
                disabled={isDeleting === rule.id}
                className={cn(
                  'rounded p-1 transition-colors',
                  confirmDeleteId === rule.id
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                )}
                aria-label={
                  confirmDeleteId === rule.id ? 'Confirm delete' : 'Delete rule'
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
