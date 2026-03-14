import { useState, useRef, useEffect } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { cn } from '@chorechamp/ui';

interface TagItem {
  id: string;
  name: string;
  color: string;
}

interface TagPickerProps {
  availableTags: TagItem[];
  selectedTags: TagItem[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onCreateTag?: (name: string, color: string) => void;
  className?: string;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280',
];

export function TagPicker({
  availableTags,
  selectedTags,
  onAddTag,
  onRemoveTag,
  onCreateTag,
  className,
}: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedIds = new Set(selectedTags.map(t => t.id));
  const unselectedTags = availableTags.filter(t => !selectedIds.has(t.id));
  const filteredTags = search
    ? unselectedTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : unselectedTags;
  const showCreateOption = search && onCreateTag &&
    !availableTags.some(t => t.name.toLowerCase() === search.toLowerCase());

  const handleCreate = () => {
    if (!search.trim() || !onCreateTag) return;
    onCreateTag(search.trim(), newColor);
    setSearch('');
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map(tag => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
            <button
              onClick={() => onRemoveTag(tag.id)}
              className="rounded-full p-0.5 hover:bg-white/20"
              aria-label={`Remove ${tag.name}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          <Plus className="h-3 w-3" />
          Add Tag
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
          <div className="px-2 pb-1">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create..."
              className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showCreateOption) {
                  handleCreate();
                }
              }}
            />
          </div>

          <div className="max-h-40 overflow-y-auto">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => { onAddTag(tag.id); setSearch(''); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}

            {filteredTags.length === 0 && !showCreateOption && (
              <p className="px-3 py-2 text-xs text-gray-400">No tags found</p>
            )}

            {showCreateOption && (
              <div className="border-t border-gray-100 px-3 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Create "{search}"</span>
                </div>
                <div className="flex items-center gap-1 mb-1.5">
                  {TAG_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        'h-4 w-4 rounded-full border',
                        newColor === c ? 'border-gray-900 ring-1 ring-gray-400' : 'border-transparent'
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  <Tag className="h-3 w-3" />
                  Create tag
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface TagBadgeProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export function TagBadge({ name, color, size = 'sm', onRemove }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium text-white',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      )}
      style={{ backgroundColor: color }}
    >
      {name}
      {onRemove && (
        <button onClick={onRemove} className="rounded-full p-0.5 hover:bg-white/20" aria-label={`Remove ${name}`}>
          <X className="h-2 w-2" />
        </button>
      )}
    </span>
  );
}
