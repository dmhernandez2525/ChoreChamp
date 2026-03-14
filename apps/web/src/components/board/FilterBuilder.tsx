import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@chorechamp/ui';
import { useFilterStore } from '@/stores/filter-store';
import type { ChoreFilter, FilterOperator } from '@chorechamp/types';

interface FilterBuilderProps {
  onClose?: () => void;
}

const FILTER_FIELDS = [
  { value: 'category', label: 'Category', type: 'select' as const },
  { value: 'priority', label: 'Priority', type: 'select' as const },
  { value: 'difficulty', label: 'Difficulty', type: 'select' as const },
  { value: 'assignedTo', label: 'Assigned To', type: 'text' as const },
  { value: 'pointValue', label: 'Points', type: 'number' as const },
  { value: 'estimatedMinutes', label: 'Estimated Time', type: 'number' as const },
  { value: 'startDate', label: 'Due Date', type: 'date' as const },
  { value: 'requiresApproval', label: 'Requires Approval', type: 'boolean' as const },
  { value: 'requiresPhoto', label: 'Requires Photo', type: 'boolean' as const },
];

const OPERATORS_BY_TYPE: Record<string, Array<{ value: FilterOperator; label: string }>> = {
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'in', label: 'is one of' },
  ],
  text: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'starts_with', label: 'starts with' },
  ],
  number: [
    { value: 'equals', label: 'equals' },
    { value: 'gt', label: 'greater than' },
    { value: 'lt', label: 'less than' },
    { value: 'gte', label: 'at least' },
    { value: 'lte', label: 'at most' },
  ],
  date: [
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
    { value: 'is_today', label: 'is today' },
    { value: 'is_this_week', label: 'is this week' },
    { value: 'is_overdue', label: 'is overdue' },
  ],
  boolean: [
    { value: 'is_true', label: 'is true' },
    { value: 'is_false', label: 'is false' },
  ],
};

const FIELD_VALUES: Record<string, Array<{ value: string; label: string }>> = {
  category: [
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'living_room', label: 'Living Room' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'pet_care', label: 'Pet Care' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'general', label: 'General' },
  ],
  priority: [
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ],
  difficulty: [
    { value: 'trivial', label: 'Trivial' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'epic', label: 'Epic' },
  ],
};

interface FilterRow {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

const defaultRow: FilterRow = { field: 'category', operator: 'equals', value: '' };

export function FilterBuilder({ onClose }: FilterBuilderProps) {
  const { addFilter } = useFilterStore();
  const [rows, setRows] = useState<FilterRow[]>([{ ...defaultRow }]);

  const addRow = () => {
    setRows([...rows, { ...defaultRow }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, updates: Partial<FilterRow>) => {
    setRows(rows.map((row, i) => {
      if (i !== index) return row;
      const updated = { ...row, ...updates };
      // Reset operator and value when field changes
      if (updates.field && updates.field !== row.field) {
        const fieldDef = FILTER_FIELDS.find(f => f.value === updates.field);
        const operators = OPERATORS_BY_TYPE[fieldDef?.type || 'text'];
        updated.operator = operators[0].value;
        updated.value = '';
      }
      return updated;
    }));
  };

  const applyFilters = () => {
    for (const row of rows) {
      if (row.field && row.operator) {
        const filter: ChoreFilter = {
          field: row.field,
          operator: row.operator,
          value: row.value,
        };
        addFilter(filter);
      }
    }
    onClose?.();
  };

  const getFieldType = (fieldName: string): string => {
    return FILTER_FIELDS.find(f => f.value === fieldName)?.type || 'text';
  };

  const isUnaryOperator = (op: FilterOperator): boolean => {
    return ['is_overdue', 'is_today', 'is_this_week', 'is_true', 'is_false'].includes(op);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg" data-testid="filter-builder">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Add Filters</h3>

      <div className="space-y-2">
        {rows.map((row, index) => {
          const fieldType = getFieldType(row.field);
          const operators = OPERATORS_BY_TYPE[fieldType] || [];
          const fieldValues = FIELD_VALUES[row.field];

          return (
            <div key={index} className="flex items-center gap-2">
              {/* Field select */}
              <select
                value={row.field}
                onChange={(e) => updateRow(index, { field: e.target.value })}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                {FILTER_FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              {/* Operator select */}
              <select
                value={row.operator}
                onChange={(e) => updateRow(index, { operator: e.target.value as FilterOperator })}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>

              {/* Value input (hidden for unary operators) */}
              {!isUnaryOperator(row.operator) && (
                <>
                  {fieldValues ? (
                    <select
                      value={row.value as string}
                      onChange={(e) => updateRow(index, { value: e.target.value })}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">Select...</option>
                      {fieldValues.map(v => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  ) : fieldType === 'number' ? (
                    <input
                      type="number"
                      value={row.value as string}
                      onChange={(e) => updateRow(index, { value: e.target.value })}
                      className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      placeholder="0"
                    />
                  ) : fieldType === 'date' ? (
                    <input
                      type="date"
                      value={row.value as string}
                      onChange={(e) => updateRow(index, { value: e.target.value })}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={row.value as string}
                      onChange={(e) => updateRow(index, { value: e.target.value })}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      placeholder="Value..."
                    />
                  )}
                </>
              )}

              {/* Remove row */}
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(index)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-3 w-3" />
          Add Condition
        </Button>
        <div className="flex gap-2">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button size="sm" onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
