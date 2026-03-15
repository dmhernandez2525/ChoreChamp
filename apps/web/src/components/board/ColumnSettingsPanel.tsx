import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, GripVertical, Palette } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button, cn } from '@chorechamp/ui';
import { useBoardStore } from '@/stores/board-store';
import { useUpdateBoardPreferences, useAutomationRules, useCreateAutomationRule, useUpdateAutomationRule, useDeleteAutomationRule } from '@chorechamp/api-client';
import { AutomationRuleBuilder } from './AutomationRuleBuilder';
import { AutomationRuleList } from './AutomationRuleList';
import type { AutomationRule } from '../../lib/api';

interface ColumnSettingsPanelProps {
  householdId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  color: string;
  wipLimit: number;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'not_started', label: 'Not Started', visible: true, color: '#6b7280', wipLimit: 0 },
  { id: 'in_progress', label: 'In Progress', visible: true, color: '#3b82f6', wipLimit: 5 },
  { id: 'needs_review', label: 'Needs Review', visible: true, color: '#f59e0b', wipLimit: 3 },
  { id: 'completed', label: 'Completed', visible: true, color: '#22c55e', wipLimit: 0 },
  { id: 'blocked', label: 'Blocked', visible: false, color: '#ef4444', wipLimit: 0 },
];

const PRESET_COLORS = [
  '#6b7280', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

export function ColumnSettingsPanel({ householdId, open, onOpenChange }: ColumnSettingsPanelProps) {
  const { columnSettings } = useBoardStore();
  const updatePrefs = useUpdateBoardPreferences(householdId);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [editingColor, setEditingColor] = useState<string | null>(null);
  const [showAutomation, setShowAutomation] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);

  const { data: automationData } = useAutomationRules(householdId);
  const automationRulesRaw = Array.isArray(automationData) ? automationData : (automationData?.rules ?? []);
  // Map API rules to the format AutomationRuleList expects
  const automationRules: AutomationRule[] = automationRulesRaw.map((r: any) => ({
    id: r.id,
    householdId: r.householdId,
    name: r.name,
    description: r.description ?? '',
    trigger: r.trigger?.type ?? r.trigger ?? '',
    triggerConfig: r.trigger?.config ?? r.triggerConfig ?? {},
    action: r.actions?.[0]?.type ?? r.action ?? '',
    actionConfig: r.actions?.[0]?.config ?? r.actionConfig ?? {},
    enabled: r.status === 'active' || r.enabled === true,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  const createRule = useCreateAutomationRule(householdId);
  const updateRule = useUpdateAutomationRule(householdId);
  const deleteRule = useDeleteAutomationRule(householdId);

  useEffect(() => {
    if (columnSettings && Object.keys(columnSettings).length > 0) {
      setColumns(prev => prev.map(col => ({
        ...col,
        ...(columnSettings[col.id] ?? {}),
      })));
    }
  }, [columnSettings]);

  const toggleVisibility = (colId: string) => {
    setColumns(prev => prev.map(col =>
      col.id === colId ? { ...col, visible: !col.visible } : col
    ));
  };

  const setColor = (colId: string, color: string) => {
    setColumns(prev => prev.map(col =>
      col.id === colId ? { ...col, color } : col
    ));
    setEditingColor(null);
  };

  const setWipLimit = (colId: string, limit: number) => {
    setColumns(prev => prev.map(col =>
      col.id === colId ? { ...col, wipLimit: Math.max(0, limit) } : col
    ));
  };

  const handleSaveRule = (data: any) => {
    if (editingRule) {
      updateRule.mutate({ ruleId: editingRule.id, data }, {
        onSuccess: () => { setShowRuleBuilder(false); setEditingRule(null); },
      });
    } else {
      createRule.mutate(data, {
        onSuccess: () => { setShowRuleBuilder(false); },
      });
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const rule = automationRules.find((r) => r.id === ruleId);
    if (rule) {
      updateRule.mutate({ ruleId, data: { status: rule.enabled ? 'inactive' : 'active' } as any });
    }
  };

  const handleSave = () => {
    const settings: Record<string, { visible: boolean; color: string; wipLimit: number }> = {};
    for (const col of columns) {
      settings[col.id] = { visible: col.visible, color: col.color, wipLimit: col.wipLimit };
    }
    updatePrefs.mutate(
      { columnSettings: settings },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-white shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          data-testid="column-settings-panel"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Column Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 space-y-3">
            {columns.map(col => (
              <div
                key={col.id}
                className={cn(
                  'rounded-lg border p-3 transition-opacity',
                  col.visible ? 'border-gray-200' : 'border-gray-100 opacity-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900">{col.label}</span>
                  <button
                    onClick={() => toggleVisibility(col.id)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    aria-label={col.visible ? 'Hide column' : 'Show column'}
                  >
                    {col.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>

                {col.visible && (
                  <div className="mt-3 flex items-center gap-4 pl-6">
                    {/* Color picker */}
                    <div className="relative">
                      <button
                        onClick={() => setEditingColor(editingColor === col.id ? null : col.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <Palette className="h-3 w-3" />
                        Color
                      </button>
                      {editingColor === col.id && (
                        <div className="absolute left-0 top-6 z-10 flex gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => setColor(col.id, c)}
                              className={cn(
                                'h-5 w-5 rounded-full border-2',
                                col.color === c ? 'border-gray-900' : 'border-transparent'
                              )}
                              style={{ backgroundColor: c }}
                              aria-label={`Set color to ${c}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* WIP limit */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-gray-500">WIP Limit:</label>
                      <input
                        type="number"
                        min="0"
                        value={col.wipLimit}
                        onChange={(e) => setWipLimit(col.id, parseInt(e.target.value) || 0)}
                        className="w-14 rounded border border-gray-300 px-1.5 py-0.5 text-xs text-center"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Automation Rules section */}
          <div className="border-t border-gray-200 px-5 py-4">
            <button
              onClick={() => setShowAutomation(!showAutomation)}
              className="flex w-full items-center justify-between text-sm font-semibold text-gray-700"
            >
              Automation Rules
              <span className="text-xs text-gray-400">{automationRules.length} rules</span>
            </button>
            {showAutomation && (
              <div className="mt-3">
                {showRuleBuilder ? (
                  <AutomationRuleBuilder
                    initialData={editingRule ? {
                      name: editingRule.name,
                      description: editingRule.description ?? '',
                      trigger: editingRule.trigger as any,
                      triggerConfig: editingRule.triggerConfig,
                      action: editingRule.action as any,
                      actionConfig: editingRule.actionConfig,
                      enabled: editingRule.enabled,
                    } : undefined}
                    onSave={handleSaveRule}
                    onCancel={() => { setShowRuleBuilder(false); setEditingRule(null); }}
                    isSaving={createRule.isPending || updateRule.isPending}
                  />
                ) : (
                  <AutomationRuleList
                    rules={automationRules}
                    onEdit={(rule) => { setEditingRule(rule); setShowRuleBuilder(true); }}
                    onDelete={(ruleId) => deleteRule.mutate(ruleId)}
                    onToggle={handleToggleRule}
                    onCreate={() => { setEditingRule(null); setShowRuleBuilder(true); }}
                    isDeleting={deleteRule.isPending ? (deleteRule.variables as string) : null}
                  />
                )}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 border-t border-gray-200 bg-white px-5 py-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </Dialog.Close>
            <Button size="sm" onClick={handleSave} disabled={updatePrefs.isPending}>
              {updatePrefs.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
