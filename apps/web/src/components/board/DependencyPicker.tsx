import { useState } from 'react';
import { Link, Unlink, ArrowRight, AlertTriangle, Search } from 'lucide-react';
import { Button, cn } from '@chorechamp/ui';
import type { Chore, DependencyType } from '@chorechamp/types';

interface DependencyItem {
  id: string;
  choreId: string;
  dependsOnChoreId: string;
  type: string;
  relatedChoreTitle: string;
  relatedChoreIcon: string;
}

interface DependencyPickerProps {
  choreId: string;
  dependencies: DependencyItem[];
  availableChores: Chore[];
  onAddDependency: (dependsOnChoreId: string, type: DependencyType) => void;
  onRemoveDependency: (depId: string) => void;
  className?: string;
}

const DEPENDENCY_TYPES: Array<{ value: DependencyType; label: string; icon: string }> = [
  { value: 'blocks', label: 'Blocks', icon: '🚫' },
  { value: 'blocked_by', label: 'Blocked by', icon: '🔒' },
  { value: 'relates_to', label: 'Related to', icon: '🔗' },
];

export function DependencyPicker({
  choreId,
  dependencies,
  availableChores,
  onAddDependency,
  onRemoveDependency,
  className,
}: DependencyPickerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<DependencyType>('blocks');

  const linkedIds = new Set(dependencies.map(d =>
    d.choreId === choreId ? d.dependsOnChoreId : d.choreId
  ));
  linkedIds.add(choreId); // Can't link to self

  const filteredChores = availableChores.filter(c =>
    !linkedIds.has(c.id) &&
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn('space-y-3', className)} data-testid="dependency-picker">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase text-gray-500">Dependencies</h4>
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(!isAdding)}>
          <Link className="mr-1 h-3 w-3" />
          {isAdding ? 'Cancel' : 'Link'}
        </Button>
      </div>

      {/* Existing dependencies */}
      {dependencies.length === 0 && !isAdding && (
        <p className="text-xs text-gray-400 py-2">No dependencies linked</p>
      )}

      {dependencies.map(dep => {
        const isBlocked = dep.type === 'blocked_by' || (dep.type === 'blocks' && dep.choreId !== choreId);
        return (
          <div key={dep.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
            {isBlocked && <AlertTriangle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />}
            {!isBlocked && <ArrowRight className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
            <span className="text-sm">{dep.relatedChoreIcon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate block">
                {dep.relatedChoreTitle}
              </span>
              <span className="text-[10px] text-gray-400 capitalize">{dep.type.replace(/_/g, ' ')}</span>
            </div>
            <button
              onClick={() => onRemoveDependency(dep.id)}
              className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
              aria-label="Remove dependency"
            >
              <Unlink className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      {/* Add dependency form */}
      {isAdding && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
          {/* Type selector */}
          <div className="flex gap-1">
            {DEPENDENCY_TYPES.map(dt => (
              <button
                key={dt.value}
                onClick={() => setSelectedType(dt.value)}
                className={cn(
                  'flex-1 rounded px-2 py-1 text-xs font-medium transition-colors',
                  selectedType === dt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-blue-100'
                )}
              >
                {dt.icon} {dt.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chores..."
              className="w-full rounded border border-gray-200 bg-white pl-7 pr-2 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {filteredChores.slice(0, 8).map(chore => (
              <button
                key={chore.id}
                onClick={() => {
                  onAddDependency(chore.id, selectedType);
                  setSearch('');
                  setIsAdding(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-white"
              >
                <span>{chore.icon}</span>
                <span className="truncate">{chore.title}</span>
              </button>
            ))}
            {filteredChores.length === 0 && (
              <p className="text-xs text-gray-400 py-1 text-center">No matching chores</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
